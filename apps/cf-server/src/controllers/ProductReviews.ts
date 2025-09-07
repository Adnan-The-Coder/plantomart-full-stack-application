import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray, desc, asc } from 'drizzle-orm';
import { productReviews, products, userProfiles } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

type ProductReview = typeof productReviews.$inferSelect;

// Interface for reply structure
interface Reply {
  user_uuid: string;
  comment: string;
  created_at: string;
}

// Validation helper for replies
const validateReplies = (replies: any[]): boolean => {
  if (!Array.isArray(replies)) {
    return false;
  }

  return replies.every(reply => 
    reply &&
    typeof reply === 'object' &&
    typeof reply.user_uuid === 'string' &&
    reply.user_uuid.trim() !== '' &&
    typeof reply.comment === 'string' &&
    reply.comment.trim() !== '' &&
    typeof reply.created_at === 'string'
  );
};

// Create a new product review
export const createProductReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const { 
      product_id, 
      user_uuid, 
      comments,
      replies = []
    } = body;

    // Validate required fields
    if (!product_id || !user_uuid || !comments) {
      return c.json(
        {
          success: false,
          message: 'Product ID, user UUID, and comments are required'
        },
        400
      );
    }

    // Validate comments length
    if (comments.trim().length < 10) {
      return c.json(
        {
          success: false,
          message: 'Comments must be at least 10 characters long'
        },
        400
      );
    }

    // Validate replies if provided
    if (replies.length > 0 && !validateReplies(replies)) {
      return c.json(
        {
          success: false,
          message: 'Replies must be an array of objects with user_uuid, comment, and created_at fields'
        },
        400
      );
    }

    // Check if product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.product_id, product_id))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product not found'
        },
        404
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, user_uuid))
      .limit(1);

    if (user.length === 0) {
      return c.json(
        {
          success: false,
          message: 'User not found'
        },
        404
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(and(
        eq(productReviews.product_id, product_id),
        eq(productReviews.user_uuid, user_uuid)
      ))
      .limit(1);

    if (existingReview.length > 0) {
      return c.json(
        {
          success: false,
          message: 'User has already reviewed this product'
        },
        409
      );
    }

    // Generate unique review ID
    const reviewId = uuidv4();

    // Insert new review
    const result = await db
      .insert(productReviews)
      .values({
        review_id: reviewId,
        product_id: product_id.trim(),
        user_uuid: user_uuid.trim(),
        likes: 0,
        liked_by: JSON.stringify([]),
        disliked_by: JSON.stringify([]),
        dislikes: 0,
        comments: comments.trim(),
        replies: JSON.stringify(replies),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning();

    return c.json({
      success: true,
      message: 'Product review created successfully!',
      data: {
        ...result[0],
        liked_by: JSON.parse(result[0].liked_by as string),
        disliked_by: JSON.parse(result[0].disliked_by as string),
        replies: JSON.parse(result[0].replies as string)
      }
    }, 201);

  } catch (error) {
    console.error('Create product review error:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json(
        {
          success: false,
          message: 'A review with this ID already exists'
        },
        409
      );
    }

    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get reviews by product ID with pagination and sorting
export const getReviewByProductID = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { productId } = c.req.param();
    const { sortBy = 'newest', page = '1', limit = '10' } = c.req.query();

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = Math.min(parseInt(limit as string, 10), 50); // max 50
    const offset = (pageNumber - 1) * limitNumber;

    if (!productId) {
      return c.json(
        {
          success: false,
          message: 'Product ID is required'
        },
        400
      );
    }

    // Check if product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product not found'
        },
        404
      );
    }

    // Sorting logic
    let orderClause;
    switch (sortBy) {
      case 'oldest':
        orderClause = asc(productReviews.created_at);
        break;
      case 'likes':
        orderClause = desc(productReviews.likes);
        break;
      case 'dislikes':
        orderClause = desc(productReviews.dislikes);
        break;
      case 'newest':
      default:
        orderClause = desc(productReviews.created_at);
        break;
    }

    // Get reviews
    const results = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.product_id, productId))
      .orderBy(orderClause)
      .limit(limitNumber)
      .offset(offset);

    // Parse JSON fields
    const formattedResults = results.map(review => ({
      ...review,
      liked_by: JSON.parse(review.liked_by as string),
      disliked_by: JSON.parse(review.disliked_by as string),
      replies: JSON.parse(review.replies as string)
    }));

    return c.json({
      success: true,
      message: 'Product reviews retrieved successfully',
      data: formattedResults,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        count: formattedResults.length
      }
    });

  } catch (error) {
    console.error('Get reviews by product ID error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
}; 

// Get a single product review by ID
export const getProductReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Review ID is required'
        },
        400
      );
    }

    const result = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    const review = {
      ...result[0],
      liked_by: JSON.parse(result[0].liked_by as string),
      disliked_by: JSON.parse(result[0].disliked_by as string),
      replies: JSON.parse(result[0].replies as string)
    };

    return c.json({
      success: true,
      message: 'Product review retrieved successfully',
      data: review
    });

  } catch (error) {
    console.error('Get product review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Update an existing product review
export const updateProductReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { comments, replies } = body;

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Review ID is required'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    // Validate comments if provided
    if (comments && comments.trim().length < 10) {
      return c.json(
        {
          success: false,
          message: 'Comments must be at least 10 characters long'
        },
        400
      );
    }

    // Validate replies if provided
    if (replies && !validateReplies(replies)) {
      return c.json(
        {
          success: false,
          message: 'Replies must be an array of objects with user_uuid, comment, and created_at fields'
        },
        400
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (comments) updateData.comments = comments.trim();
    if (replies) updateData.replies = JSON.stringify(replies);

    // Perform update
    const result = await db
      .update(productReviews)
      .set(updateData)
      .where(eq(productReviews.review_id, id))
      .returning();

    const updatedReview = {
      ...result[0],
      liked_by: JSON.parse(result[0].liked_by as string),
      disliked_by: JSON.parse(result[0].disliked_by as string),
      replies: JSON.parse(result[0].replies as string)
    };

    return c.json({
      success: true,
      message: 'Product review updated successfully!',
      data: updatedReview
    });

  } catch (error) {
    console.error('Update product review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Delete a product review
export const deleteProductReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Review ID is required'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    // Delete the review
    await db
      .delete(productReviews)
      .where(eq(productReviews.review_id, id));

    return c.json({
      success: true,
      message: 'Product review deleted successfully!'
    });

  } catch (error) {
    console.error('Delete product review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Like a review
export const likeReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { user_uuid } = body;

    if (!id || !user_uuid) {
      return c.json(
        {
          success: false,
          message: 'Review ID and user UUID are required'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, user_uuid))
      .limit(1);

    if (user.length === 0) {
      return c.json(
        {
          success: false,
          message: 'User not found'
        },
        404
      );
    }

    const review = existingReview[0];
    const likedBy = JSON.parse(review.liked_by as string) as string[];
    const dislikedBy = JSON.parse(review.disliked_by as string) as string[];

    // Check if user already liked the review
    if (likedBy.includes(user_uuid)) {
      return c.json(
        {
          success: false,
          message: 'User has already liked this review'
        },
        409
      );
    }

    // Remove from disliked if present and add to liked
    const newDislikedBy = dislikedBy.filter(uuid => uuid !== user_uuid);
    const newLikedBy = [...likedBy, user_uuid];

    // Update the review
    const result = await db
      .update(productReviews)
      .set({
        likes: newLikedBy.length,
        liked_by: JSON.stringify(newLikedBy),
        dislikes: newDislikedBy.length,
        disliked_by: JSON.stringify(newDislikedBy),
        updated_at: new Date().toISOString()
      })
      .where(eq(productReviews.review_id, id))
      .returning();

    return c.json({
      success: true,
      message: 'Review liked successfully!',
      data: {
        ...result[0],
        liked_by: JSON.parse(result[0].liked_by as string),
        disliked_by: JSON.parse(result[0].disliked_by as string),
        replies: JSON.parse(result[0].replies as string)
      }
    });

  } catch (error) {
    console.error('Like review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Dislike a review
export const dislikeReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { user_uuid } = body;

    if (!id || !user_uuid) {
      return c.json(
        {
          success: false,
          message: 'Review ID and user UUID are required'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, user_uuid))
      .limit(1);

    if (user.length === 0) {
      return c.json(
        {
          success: false,
          message: 'User not found'
        },
        404
      );
    }

    const review = existingReview[0];
    const likedBy = JSON.parse(review.liked_by as string) as string[];
    const dislikedBy = JSON.parse(review.disliked_by as string) as string[];

    // Check if user already disliked the review
    if (dislikedBy.includes(user_uuid)) {
      return c.json(
        {
          success: false,
          message: 'User has already disliked this review'
        },
        409
      );
    }

    // Remove from liked if present and add to disliked
    const newLikedBy = likedBy.filter(uuid => uuid !== user_uuid);
    const newDislikedBy = [...dislikedBy, user_uuid];

    // Update the review
    const result = await db
      .update(productReviews)
      .set({
        likes: newLikedBy.length,
        liked_by: JSON.stringify(newLikedBy),
        dislikes: newDislikedBy.length,
        disliked_by: JSON.stringify(newDislikedBy),
        updated_at: new Date().toISOString()
      })
      .where(eq(productReviews.review_id, id))
      .returning();

    return c.json({
      success: true,
      message: 'Review disliked successfully!',
      data: {
        ...result[0],
        liked_by: JSON.parse(result[0].liked_by as string),
        disliked_by: JSON.parse(result[0].disliked_by as string),
        replies: JSON.parse(result[0].replies as string)
      }
    });

  } catch (error) {
    console.error('Dislike review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Remove like/dislike from a review
export const removeLikeDislike = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { user_uuid } = body;

    if (!id || !user_uuid) {
      return c.json(
        {
          success: false,
          message: 'Review ID and user UUID are required'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    const review = existingReview[0];
    const likedBy = JSON.parse(review.liked_by as string) as string[];
    const dislikedBy = JSON.parse(review.disliked_by as string) as string[];

    // Remove user from both liked and disliked arrays
    const newLikedBy = likedBy.filter(uuid => uuid !== user_uuid);
    const newDislikedBy = dislikedBy.filter(uuid => uuid !== user_uuid);

    // Check if user had actually liked or disliked
    const hadInteraction = likedBy.includes(user_uuid) || dislikedBy.includes(user_uuid);

    if (!hadInteraction) {
      return c.json(
        {
          success: false,
          message: 'User has not liked or disliked this review'
        },
        400
      );
    }

    // Update the review
    const result = await db
      .update(productReviews)
      .set({
        likes: newLikedBy.length,
        liked_by: JSON.stringify(newLikedBy),
        dislikes: newDislikedBy.length,
        disliked_by: JSON.stringify(newDislikedBy),
        updated_at: new Date().toISOString()
      })
      .where(eq(productReviews.review_id, id))
      .returning();

    return c.json({
      success: true,
      message: 'Like/dislike removed successfully!',
      data: {
        ...result[0],
        liked_by: JSON.parse(result[0].liked_by as string),
        disliked_by: JSON.parse(result[0].disliked_by as string),
        replies: JSON.parse(result[0].replies as string)
      }
    });

  } catch (error) {
    console.error('Remove like/dislike error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Add a reply to a review
export const addReplyToReview = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { user_uuid, comment } = body;

    if (!id || !user_uuid || !comment) {
      return c.json(
        {
          success: false,
          message: 'Review ID, user UUID, and comment are required'
        },
        400
      );
    }

    // Validate comment length
    if (comment.trim().length < 5) {
      return c.json(
        {
          success: false,
          message: 'Reply comment must be at least 5 characters long'
        },
        400
      );
    }

    // Check if review exists
    const existingReview = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.review_id, id))
      .limit(1);

    if (existingReview.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product review not found'
        },
        404
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, user_uuid))
      .limit(1);

    if (user.length === 0) {
      return c.json(
        {
          success: false,
          message: 'User not found'
        },
        404
      );
    }

    const review = existingReview[0];
    const existingReplies = JSON.parse(review.replies as string) as Reply[];

    // Create new reply
    const newReply: Reply = {
      user_uuid: user_uuid.trim(),
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    const updatedReplies = [...existingReplies, newReply];

    // Update the review with new reply
    const result = await db
      .update(productReviews)
      .set({
        replies: JSON.stringify(updatedReplies),
        updated_at: new Date().toISOString()
      })
      .where(eq(productReviews.review_id, id))
      .returning();

    return c.json({
      success: true,
      message: 'Reply added successfully!',
      data: {
        ...result[0],
        liked_by: JSON.parse(result[0].liked_by as string),
        disliked_by: JSON.parse(result[0].disliked_by as string),
        replies: JSON.parse(result[0].replies as string)
      }
    });

  } catch (error) {
    console.error('Add reply to review error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Delete all reviews for a specific product (admin function)
export const deleteAllReviewsForProduct = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { productId } = c.req.param();

    if (!productId) {
      return c.json(
        {
          success: false,
          message: 'Product ID is required'
        },
        400
      );
    }

    // Check if product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product not found'
        },
        404
      );
    }

    // Get count of existing reviews
    const existingReviews = await db
      .select({ count: productReviews.id })
      .from(productReviews)
      .where(eq(productReviews.product_id, productId));

    const deletedCount = existingReviews.length;

    // Delete all reviews for this product
    await db
      .delete(productReviews)
      .where(eq(productReviews.product_id, productId));

    return c.json({
      success: true,
      message: `${deletedCount} product reviews deleted successfully!`,
      deletedCount
    });

  } catch (error) {
    console.error('Delete all reviews for product error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get review statistics for a product
export const getReviewStats = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { productId } = c.req.param();

    if (!productId) {
      return c.json(
        {
          success: false,
          message: 'Product ID is required'
        },
        400
      );
    }

    // Check if product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product not found'
        },
        404
      );
    }

    // Get all reviews for the product
    const reviews = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.product_id, productId));

    // Calculate statistics
    const totalReviews = reviews.length;
    const totalLikes = reviews.reduce((sum, review) => sum + review.likes, 0);
    const totalDislikes = reviews.reduce((sum, review) => sum + review.dislikes, 0);
    const totalReplies = reviews.reduce((sum, review) => {
      const replies = JSON.parse(review.replies as string) as Reply[];
      return sum + replies.length;
    }, 0);

    const averageLikes = totalReviews > 0 ? (totalLikes / totalReviews).toFixed(2) : 0;
    const averageDislikes = totalReviews > 0 ? (totalDislikes / totalReviews).toFixed(2) : 0;

    // Get most liked review
    const mostLikedReview = reviews.length > 0 
      ? reviews.reduce((max, review) => review.likes > max.likes ? review : max)
      : null;

    return c.json({
      success: true,
      message: 'Review statistics retrieved successfully',
      data: {
        totalReviews,
        totalLikes,
        totalDislikes,
        totalReplies,
        averageLikes: parseFloat(averageLikes.toString()),
        averageDislikes: parseFloat(averageDislikes.toString()),
        mostLikedReview: mostLikedReview ? {
          review_id: mostLikedReview.review_id,
          likes: mostLikedReview.likes,
          comments: mostLikedReview.comments
        } : null
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Bulk delete reviews by IDs
export const bulkDeleteReviews = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const { review_ids } = body;

    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Review IDs array is required and must not be empty'
        },
        400
      );
    }

    // Validate all review IDs are strings
    if (!review_ids.every(id => typeof id === 'string' && id.trim() !== '')) {
      return c.json(
        {
          success: false,
          message: 'All review IDs must be non-empty strings'
        },
        400
      );
    }

    // Check which reviews exist
    const existingReviews = await db
      .select({ review_id: productReviews.review_id })
      .from(productReviews)
      .where(inArray(productReviews.review_id, review_ids));

    const existingIds = existingReviews.map(r => r.review_id);
    const missingIds = review_ids.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return c.json(
        {
          success: false,
          message: `Reviews not found: ${missingIds.join(', ')}`
        },
        404
      );
    }

    // Delete the reviews
    await db
      .delete(productReviews)
      .where(inArray(productReviews.review_id, review_ids));

    return c.json({
      success: true,
      message: `${review_ids.length} reviews deleted successfully!`,
      deletedCount: review_ids.length
    });

  } catch (error) {
    console.error('Bulk delete reviews error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get most recent reviews across all products
export const getRecentReviews = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { limit = '10', offset = '0' } = c.req.query();

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      return c.json(
        {
          success: false,
          message: 'Limit must be a number between 1 and 100'
        },
        400
      );
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return c.json(
        {
          success: false,
          message: 'Offset must be a non-negative number'
        },
        400
      );
    }

    const results = await db
      .select()
      .from(productReviews)
      .orderBy(desc(productReviews.created_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Parse JSON fields
    const formattedResults = results.map(review => ({
      ...review,
      liked_by: JSON.parse(review.liked_by as string),
      disliked_by: JSON.parse(review.disliked_by as string),
      replies: JSON.parse(review.replies as string)
    }));

    return c.json({
      success: true,
      message: 'Recent product reviews retrieved successfully',
      data: formattedResults,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: formattedResults.length
      }
    });

  } catch (error) {
    console.error('Get recent reviews error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};
