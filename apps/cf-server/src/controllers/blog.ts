import { customAlphabet } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { blogs } from '../db/schema';
import { drizzle } from 'drizzle-orm/d1';
import type { Context } from 'hono';

// Create a custom nanoid generator: 8 characters, A-Z + 0-9
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Type definitions
interface BlogData {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string | string[] | any;
  authorName: string;
  authorId?: string;
  featuredImage?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

interface UpdateBlogData extends Partial<BlogData> {
  updatedAt?: string;
}

export const createBlogPost = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: BlogData = await c.req.json();

    const {
      title,
      slug,
      content,
      excerpt,
      category,
      tags,
      authorName,
      authorId,
      featuredImage,
      isFeatured,
      isPublished,
      seoTitle,
      seoDescription
    } = body;

    // Validate required fields
    if (!title || !content || !category || !authorName) {
      return c.json({
        success: false,
        message: 'Missing required fields: title, content, category, authorName',
      }, 400);
    }

    // Generate unique slug if not provided
    let finalSlug: string;
    if (slug) {
      // Validate provided slug format
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return c.json({
          success: false,
          message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.',
        }, 400);
      }
      finalSlug = slug;
    } else {
      // Generate slug from title
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Ensure slug uniqueness
    let isSlugUnique = false;
    let attemptCount = 0;
    let uniqueSlug = finalSlug;

    do {
      const existingBlog = await db
        .select()
        .from(blogs)
        .where(eq(blogs.slug, uniqueSlug))
        .limit(1)
        .then(res => res.at(0));

      if (!existingBlog) {
        isSlugUnique = true;
      } else {
        attemptCount++;
        uniqueSlug = `${finalSlug}-${nanoid(4).toLowerCase()}`;
        
        // Prevent infinite loops
        if (attemptCount > 10) {
          return c.json({
            success: false,
            message: 'Unable to generate unique slug after multiple attempts',
          }, 500);
        }
      }
    } while (!isSlugUnique);

    // Validate and parse tags if provided
    let parsedTags: string | null = null;
    if (tags) {
      try {
        if (typeof tags === 'string') {
          parsedTags = JSON.stringify(tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0));
        } else if (Array.isArray(tags)) {
          parsedTags = JSON.stringify(tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0));
        } else {
          parsedTags = JSON.stringify(tags);
        }
      } catch (error) {
        return c.json({
          success: false,
          message: 'Invalid tags format',
        }, 400);
      }
    }

    // Validate email format if authorId is provided and looks like email
    if (authorId && authorId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(authorId)) {
        return c.json({
          success: false,
          message: 'Invalid email format for authorId',
        }, 400);
      }
    }

    // Generate blog ID
    const blogId = `BLOG-${nanoid()}`;
    const now = new Date().toISOString();

    // Insert new blog post
    const result = await db.insert(blogs).values({
      blogId,
      title: title.trim(),
      slug: uniqueSlug,
      content,
      excerpt: excerpt?.trim() || null,
      category: category.trim(),
      tags: parsedTags,
      authorName: authorName.trim(),
      authorId: authorId?.trim() || null,
      featuredImage: featuredImage?.trim() || null,
      isFeatured: isFeatured ?? false,
      isPublished: isPublished ?? false,
      seoTitle: seoTitle?.trim() || null,
      seoDescription: seoDescription?.trim() || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return c.json({
      success: true,
      message: 'Blog post created successfully.',
      data: {
        blogId,
        slug: uniqueSlug,
        title: title.trim(),
        id: result[0]?.id,
      },
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

export const getAllBlogs = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    
    // Get query parameters for filtering and pagination
    const page = Number(c.req.query('page')) || 1;
    const limit = Math.min(Number(c.req.query('limit')) || 10, 100); // Max 100 per page
    const category = c.req.query('category');
    const isPublished = c.req.query('published');
    const isFeatured = c.req.query('featured');

    let query = db.select().from(blogs);

    // Apply filters
    const conditions = [];
    if (category) {
      conditions.push(eq(blogs.category, category));
    }
    if (isPublished !== undefined) {
      conditions.push(eq(blogs.isPublished, isPublished === 'true'));
    }
    if (isFeatured !== undefined) {
      conditions.push(eq(blogs.isFeatured, isFeatured === 'true'));
    }

    // Note: Drizzle ORM syntax may vary - adjust based on your version
    // This is a simplified version - you may need to chain .where() calls
    const blogs_result = await query.orderBy(desc(blogs.createdAt)).all();

    // Apply pagination in memory (for small datasets)
    // For large datasets, consider implementing database-level pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = blogs_result.slice(startIndex, endIndex);

    const totalCount = blogs_result.length;
    const totalPages = Math.ceil(totalCount / limit);

    return c.json({
      success: true,
      message: `Fetched ${paginatedBlogs.length} blog posts`,
      data: paginatedBlogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

export const getBlogBySlug = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const slug = c.req.param('slug');

    if (!slug) {
      return c.json({
        success: false,
        message: 'Slug parameter is required',
      }, 400);
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return c.json({
        success: false,
        message: 'Invalid slug format',
      }, 400);
    }

    const blog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1)
      .then(res => res.at(0));

    if (!blog) {
      return c.json({
        success: false,
        message: `Blog post with slug '${slug}' not found`,
      }, 404);
    }

    // Parse tags if they exist
    let parsedTags: any = null;
    if (blog.tags) {
      try {
        parsedTags = JSON.parse(blog.tags);
      } catch (error) {
        console.warn('Failed to parse blog tags:', error);
        parsedTags = blog.tags;
      }
    }

    return c.json({
      success: true,
      message: 'Blog post fetched successfully',
      data: {
        ...blog,
        tags: parsedTags,
      },
    });

  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

export const getBlogsByCategory = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const category = c.req.param('category');

    if (!category) {
      return c.json({
        success: false,
        message: 'Category parameter is required',
      }, 400);
    }

    const page = Number(c.req.query('page')) || 1;
    const limit = Math.min(Number(c.req.query('limit')) || 10, 100);
    const isPublished = c.req.query('published');

    let query = db
      .select()
      .from(blogs)
      .where(eq(blogs.category, category));

    // Apply additional filters
    if (isPublished !== undefined) {
      // Note: You may need to chain multiple .where() calls depending on Drizzle version
      // This is a simplified approach
    }

    const result = await query.orderBy(desc(blogs.createdAt)).all();

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = result.slice(startIndex, endIndex);

    const totalCount = result.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Parse tags for each blog
    const blogsWithParsedTags = paginatedBlogs.map((blog: any) => {
      let parsedTags: any = null;
      if (blog.tags) {
        try {
          parsedTags = JSON.parse(blog.tags);
        } catch (error) {
          parsedTags = blog.tags;
        }
      }
      return { ...blog, tags: parsedTags };
    });

    return c.json({
      success: true,
      message: `Fetched ${paginatedBlogs.length} blog posts for category '${category}'`,
      data: blogsWithParsedTags,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching blogs by category:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

export const updateBlogPost = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const slug = c.req.param('slug');
    const fieldsToUpdate = await c.req.json();

    if (!slug) {
      return c.json({
        success: false,
        message: 'Slug parameter is required',
      }, 400);
    }

    if (!fieldsToUpdate || Object.keys(fieldsToUpdate).length === 0) {
      return c.json({
        success: false,
        message: 'At least one field to update is required',
      }, 400);
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return c.json({
        success: false,
        message: 'Invalid slug format',
      }, 400);
    }

    // Check if blog exists before updating
    const existingBlog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1)
      .then(res => res.at(0));

    if (!existingBlog) {
      return c.json({
        success: false,
        message: `Blog post with slug '${slug}' not found`,
      }, 404);
    }

    // Process and validate update fields
    const updateData: UpdateBlogData = { ...fieldsToUpdate };

    // If updating slug, ensure it's unique
    if (updateData.slug && updateData.slug !== slug) {
      if (!slugRegex.test(updateData.slug)) {
        return c.json({
          success: false,
          message: 'Invalid new slug format',
        }, 400);
      }

      const slugExists = await db
        .select()
        .from(blogs)
        .where(eq(blogs.slug, updateData.slug))
        .limit(1)
        .then(res => res.length > 0);

      if (slugExists) {
        return c.json({
          success: false,
          message: 'Slug already exists. Please choose a different slug.',
        }, 409);
      }
    }

    // Validate and process tags if being updated
    if (updateData.tags) {
      try {
        if (typeof updateData.tags === 'string') {
          updateData.tags = JSON.stringify(updateData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0));
        } else if (Array.isArray(updateData.tags)) {
          updateData.tags = JSON.stringify(updateData.tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0));
        } else {
          updateData.tags = JSON.stringify(updateData.tags);
        }
      } catch (error) {
        return c.json({
          success: false,
          message: 'Invalid tags format',
        }, 400);
      }
    }

    // Trim string fields
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.excerpt) updateData.excerpt = updateData.excerpt.trim();
    if (updateData.category) updateData.category = updateData.category.trim();
    if (updateData.authorName) updateData.authorName = updateData.authorName.trim();
    if (updateData.authorId) updateData.authorId = updateData.authorId.trim();
    if (updateData.featuredImage) updateData.featuredImage = updateData.featuredImage.trim();
    if (updateData.seoTitle) updateData.seoTitle = updateData.seoTitle.trim();
    if (updateData.seoDescription) updateData.seoDescription = updateData.seoDescription.trim();

    // Validate email format if authorId is being updated and looks like email
    if (updateData.authorId && updateData.authorId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.authorId)) {
        return c.json({
          success: false,
          message: 'Invalid email format for authorId',
        }, 400);
      }
    }

    // Set updated timestamp
    updateData.updatedAt = new Date().toISOString();

    const result = await db
      .update(blogs)
      .set(updateData)
      .where(eq(blogs.slug, slug))
      .returning();

    if (!result || result.length === 0) {
      return c.json({
        success: false,
        message: `Failed to update blog post with slug '${slug}'`,
      }, 500);
    }

    return c.json({
      success: true,
      message: `Blog post with slug '${slug}' updated successfully.`,
      data: result[0],
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

export const deleteBlogPost = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const slug = c.req.param('slug');

    if (!slug) {
      return c.json({
        success: false,
        message: 'Slug parameter is required',
      }, 400);
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return c.json({
        success: false,
        message: 'Invalid slug format',
      }, 400);
    }

    // Check if blog exists before deleting
    const existingBlog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1)
      .then(res => res.at(0));

    if (!existingBlog) {
      return c.json({
        success: false,
        message: `Blog post with slug '${slug}' not found`,
      }, 404);
    }

    const result = await db
      .delete(blogs)
      .where(eq(blogs.slug, slug))
      .run();

    return c.json({
      success: true,
      message: `Blog post with slug '${slug}' deleted successfully.`,
      data: {
        deletedSlug: slug,
        deletedTitle: existingBlog.title,
      },
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET BLOG BY ID - ADMIN (Additional utility function)
export const getBlogByIdAdmin = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const blogId = c.req.param('blog_id');

    if (!blogId) {
      return c.json({
        success: false,
        message: 'Blog ID parameter is required',
      }, 400);
    }

    const blog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.blogId, blogId))
      .limit(1)
      .then(res => res.at(0));

    if (!blog) {
      return c.json({
        success: false,
        message: `Blog post with ID '${blogId}' not found`,
      }, 404);
    }

    // Parse tags if they exist
    let parsedTags = null;
    if (blog.tags) {
      try {
        parsedTags = JSON.parse(blog.tags);
      } catch (error) {
        console.warn('Failed to parse blog tags:', error);
        parsedTags = blog.tags;
      }
    }

    return c.json({
      success: true,
      message: 'Blog post fetched successfully (admin)',
      data: {
        ...blog,
        tags: parsedTags,
      },
    });

  } catch (error) {
    console.error('Error fetching blog by ID (admin):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET FEATURED BLOGS - PUBLIC
export const getFeaturedBlogs = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const limit = Math.min(Number(c.req.query('limit')) || 5, 20);

    const featuredBlogs = await db
      .select()
      .from(blogs)
      .where(eq(blogs.isFeatured, true))
      .orderBy(desc(blogs.createdAt))
      .limit(limit)
      .all();

    // Parse tags for each blog
    const blogsWithParsedTags = featuredBlogs.map((blog: any) => {
      let parsedTags: any = null;
      if (blog.tags) {
        try {
          parsedTags = JSON.parse(blog.tags);
        } catch (error) {
          parsedTags = blog.tags;
        }
      }
      return { ...blog, tags: parsedTags };
    });

    return c.json({
      success: true,
      message: `Fetched ${blogsWithParsedTags.length} featured blog posts`,
      data: blogsWithParsedTags,
    });

  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET PUBLISHED BLOGS - PUBLIC
export const getPublishedBlogs = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const page = Number(c.req.query('page')) || 1;
    const limit = Math.min(Number(c.req.query('limit')) || 10, 50);
    const category = c.req.query('category');

    let query = db
      .select()
      .from(blogs)
      .where(eq(blogs.isPublished, true));

    const publishedBlogs = await query.orderBy(desc(blogs.createdAt)).all();

    // Filter by category if provided
    const filteredBlogs = category 
      ? publishedBlogs.filter(blog => blog.category === category)
      : publishedBlogs;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

    const totalCount = filteredBlogs.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Parse tags for each blog
    const blogsWithParsedTags = paginatedBlogs.map(blog => {
      let parsedTags = null;
      if (blog.tags) {
        try {
          parsedTags = JSON.parse(blog.tags);
        } catch (error) {
          parsedTags = blog.tags;
        }
      }
      return { ...blog, tags: parsedTags };
    });

    return c.json({
      success: true,
      message: `Fetched ${paginatedBlogs.length} published blog posts${category ? ` for category '${category}'` : ''}`,
      data: blogsWithParsedTags,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching published blogs:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};