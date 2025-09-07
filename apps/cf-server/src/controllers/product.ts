import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, gte, lte, sql } from 'drizzle-orm';
import { products, productVariants, productVariantGroups } from '../db/schema';
// Simple ID generator for variants (since nanoid might not be available)
const generateVariantId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `VAR-${timestamp}-${random}`;
};

// CREATE PRODUCT
export const createProduct = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();

    const {
      product_id,
      slug,
      title,
      description,
      category,
      about_in_bullets,
      image_gallery,
      price,
      brand,
      vendorID,
      raiting,
      content_description,
      content_shipping_delivery,
      reviewNumbers,
      reviews,
      quantity,
      discount_percent,
      discountPrice,
      variants,
      variantState,
      featured,
    } = body;

    if (
      !product_id ||
      !slug ||
      !title ||
      !category ||
      !description ||
      !about_in_bullets ||
      !price ||
      !brand ||
      !content_description || 
      !content_shipping_delivery ||
      !vendorID
    ) {
      return c.json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const result = await db.insert(products).values({
      product_id,
      slug,
      title,
      description,
      category,
      about_in_bullets,
      image_gallery,
      content_description,
      content_shipping_delivery,
      price,
      brand,
      vendorID,
      raiting: raiting ?? 0,
      reviewNumbers: reviewNumbers ?? 0,
      reviews: reviews ?? null,
      quantity: quantity ?? 0,
      discountPercent: discount_percent ?? null,
      discountPrice: discountPrice ?? null,
      variants: variants ?? null,
      variantState: variantState ?? false,
      featured: featured ?? false,
    });

    return c.json({
      success: true,
      message: 'Product created successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error creating product: ', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, Please try again later',
    }, 500);
  }
};

// CREATE PRODUCT VARIANT
export const createProductVariant = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();

    console.log('Creating product variant with body:', body);

    const {
      parent_product_id,
      variant_name,
      variant_type,
      price,
      quantity,
      discount_percent,
      image_gallery,
      description,
    } = body;

    if (!parent_product_id || !variant_name || !variant_type || !price || quantity === undefined) {
      console.error('Missing required fields:', { parent_product_id, variant_name, variant_type, price, quantity });
      return c.json({
        success: false,
        message: 'Please provide all required fields: parent_product_id, variant_name, variant_type, price, quantity',
      });
    }

    // Check if parent product exists
    const parentProduct = await db
      .select()
      .from(products)
      .where(eq(products.product_id, parent_product_id))
      .get();

    if (!parentProduct) {
      console.error('Parent product not found:', parent_product_id);
      return c.json({
        success: false,
        message: 'Parent product not found',
      }, 404);
    }

    console.log('Parent product found:', parentProduct.slug);

    // Generate unique variant ID and slug
    const variant_id = generateVariantId();
    const baseSlug = parentProduct.slug;
    const variantSlug = `${baseSlug}-${variant_name.toLowerCase().replace(/\s+/g, '-')}`;

    console.log('Generated variant slug:', variantSlug);

    // Check if slug already exists
    const existingVariant = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.slug, variantSlug))
      .get();

    let finalSlug = variantSlug;
    if (existingVariant) {
      // Add timestamp to make slug unique
      const timestamp = Date.now();
      finalSlug = `${variantSlug}-${timestamp}`;
      console.log('Slug conflict, using unique slug:', finalSlug);
    }

    const variantData = {
      variant_id,
      parent_product_id,
      slug: finalSlug,
      variant_name,
      variant_type,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      discount_percent: discount_percent ? parseFloat(discount_percent) : null,
      discount_price: discount_percent ? (parseFloat(price) - (parseFloat(price) * parseFloat(discount_percent) / 100)) : null,
      image_gallery: image_gallery ? JSON.stringify(image_gallery) : null,
      description: description || null,
      is_active: true,
    };

    console.log('Inserting variant with data:', variantData);

    const result = await db.insert(productVariants).values(variantData);

    console.log('Variant created successfully:', result);

    return c.json({
      success: true,
      message: 'Product variant created successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error creating product variant: ', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, Please try again later',
    }, 500);
  }
};

// GET PRODUCT BY SLUG (with variants)
export const getProductBySlug = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const slug = c.req.param('slug');

    if (!slug) {
      return c.json({
        success: false,
        message: 'Slug parameter is required',
      }, 400);
    }

    // First, try to find the main product by slug
    let product = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .get();

    if (product) {
      // Get variants for this product
      const variants = await db
        .select()
        .from(productVariants)
        .where(and(
          eq(productVariants.parent_product_id, product.product_id),
          eq(productVariants.is_active, true)
        ))
        .all();

      return c.json({
        success: true,
        message: 'Product fetched successfully',
        data: {
          ...product,
          variants: variants.length > 0 ? variants : null,
          has_variants: variants.length > 0
        },
      });
    }

    // If not found as main product, try to find as variant
    const variant = await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.slug, slug),
        eq(productVariants.is_active, true)
      ))
      .get();

    if (variant) {
      // Get the parent product
      const parentProduct = await db
        .select()
        .from(products)
        .where(eq(products.product_id, variant.parent_product_id))
        .get();

      if (parentProduct) {
        // Get all variants for this parent product
        const allVariants = await db
          .select()
          .from(productVariants)
          .where(and(
            eq(productVariants.parent_product_id, parentProduct.product_id),
            eq(productVariants.is_active, true)
          ))
          .all();

        return c.json({
          success: true,
          message: 'Product variant fetched successfully',
          data: {
            ...parentProduct,
            variants: allVariants,
            has_variants: true,
            selected_variant: variant,
            current_variant_slug: slug
          },
        });
      }
    }

    return c.json({
      success: false,
      message: `No product found with slug '${slug}'`,
    }, 404);

  } catch (error) {
    console.error('Error fetching product by slug: ', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, Please try again later',
    }, 500);
  }
};

// UPDATE PRODUCT VARIANT
export const updateProductVariant = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const variant_id = c.req.param('variant_id');
    const fieldsToUpdate = await c.req.json();

    if (!variant_id || Object.keys(fieldsToUpdate).length === 0) {
      return c.json({
        success: false,
        message: 'Variant ID and at least one field to update are required.',
      }, 400);
    }

    // Calculate discount price if discount_percent is updated
    if (fieldsToUpdate.discount_percent && fieldsToUpdate.price) {
      fieldsToUpdate.discount_price = fieldsToUpdate.price - (fieldsToUpdate.price * fieldsToUpdate.discount_percent / 100);
    }

    const result = await db
      .update(productVariants)
      .set({
        ...fieldsToUpdate,
        updated_at: new Date().toISOString()
      })
      .where(eq(productVariants.variant_id, variant_id))
      .run() as any;

    if (result.rowsAffected === 0) {
      return c.json({
        success: false,
        message: `No variant found with ID ${variant_id} or nothing changed.`,
      }, 404);
    }

    return c.json({
      success: true,
      message: `Variant with ID ${variant_id} updated successfully.`,
      data: result,
    });

  } catch (error) {
    console.error('Error updating product variant:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// DELETE PRODUCT VARIANT
export const deleteProductVariant = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const variant_id = c.req.param('variant_id');

    if (!variant_id) {
      return c.json({
        success: false,
        message: 'Variant ID is required',
      }, 400);
    }

    const deleted = await db
      .delete(productVariants)
      .where(eq(productVariants.variant_id, variant_id))
      .run();

    return c.json({
      success: true,
      message: `Variant with ID ${variant_id} deleted successfully.`,
      data: deleted,
    });

  } catch (error) {
    console.error('Error deleting product variant:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const allProducts = await db.select().from(products).all();
    return c.json({
      success: true,
      message: `All ${allProducts.length} products fetched successfully`,
      data: allProducts,
    });

  } catch (error) {
    console.error("Error fetching products: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, Please try again later"
    }, 500);
  }
};

// GET ALL products based on the vedorID  
export const getProductsByVendor = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);

    const vendorID = c.req.param("vendorID") || c.req.query("vendorID");

    if (!vendorID) {
      return c.json({
        success: false,
        message: "Vendor ID is required",
      }, 400);
    }

    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorID, vendorID))
      .all();

    return c.json({
      success: true,
      message: `Found ${vendorProducts.length} products for vendor ${vendorID}`,
      data: vendorProducts,
    });

  } catch (error) {
    console.error("Error fetching vendor products: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, Please try again later",
    }, 500);
  }
};


// DELETE PRODUCT
export const deleteProduct = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const productId = c.req.param('product_id');

    if (!productId) {
      return c.json({
        success: false,
        message: "Product ID is required",
      }, 400);
    }

    const deleted = await db.delete(products).where(eq(products.product_id, productId)).run();

    return c.json({
      success: true,
      message: `Product with ID ${productId} deleted successfully.`,
      data: deleted
    });
  } catch (error) {
    console.error("Error deleting product: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, Please try again later"
    }, 500);
  }
};

// Update Product
export const updateProduct = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const product_id = c.req.param('product_id');
    const fieldsToUpdate = await c.req.json();

    if (!product_id || Object.keys(fieldsToUpdate).length === 0) {
      return c.json({
        success: false,
        message: 'Product ID in URL param and at least one field in body are required.',
      }, 400);
    }

    const result = await db
      .update(products)
      .set(fieldsToUpdate)
      .where(eq(products.product_id, product_id))
      .run() as any; // Cloudflare's D1Result<T> is typed generically, but doesn't expose rowsAffected directly in TypeScript, even though it's available at runtime in most run() calls. Drizzle/ORM doesn't bridge that type deeply for D1 yet.

    if (result.rowsAffected === 0) {
      return c.json({
        success: false,
        message: `No product found with ID ${product_id} or nothing changed.`,
      }, 404);
    }

    return c.json({
      success: true,
      message: `Product with ID ${product_id} updated successfully.`,
      data: result,
    });

  } catch (error) {
    console.error("Error updating product: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, Please try again later"
    }, 500);
  }
};

// GET PRODUCT BY ID
export const getProductById = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const productId = c.req.param('product_id');

    if (!productId) {
      return c.json({
        success: false,
        message: "Product ID is required",
      }, 400);
    }

    const product = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .get();

    if (!product) {
      return c.json({
        success: false,
        message: `No product found with ID ${productId}`,
      }, 404);
    }

    return c.json({
      success: true,
      message: `Product with ID ${productId} fetched successfully.`,
      data: product,
    });

  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, Please try again later",
    }, 500);
  }
};


export const getFeaturedProducts = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const featuredProducts = await db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .all();

    return c.json({
      success: true,
      message: `Found ${featuredProducts.length} featured products`,
      data: featuredProducts,
    });

  } catch (error) {
    console.error("Error fetching featured products: ", error);
    return c.json({
      success: false,
      message: "Internal Server Error, please try again later"
    }, 500);
  }
};

// Fetch featured products by category
export const getFeaturedProductsByCategory = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    // Accept category as query param (?category=Indoor Plants) or route param
    const category = c.req.query('category') || c.req.param('category');
    if (!category) {
      return c.json({
        success: false,
        message: 'Category parameter is required',
      }, 400);
    }
    const featuredProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.featured, true),
          eq(products.category, category)
        )
      )
      .all();
    if (!featuredProducts || featuredProducts.length === 0) {
      return c.json({
        success: false,
        message: `No featured products found for category '${category}'`,
      }, 404);
    }
    return c.json({
      success: true,
      message: `Found ${featuredProducts.length} featured products for category '${category}'`,
      data: featuredProducts,
    });
  } catch (error) {
    console.error('Error fetching featured products by category:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, please try again later',
    }, 500);
  }
};

// Fetch products starting from a given price (optionally within a range)
export const getProductsByStartingPrice = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    // Accept price as query param (?price=149) or route param
    const priceParam = c.req.query('price') || c.req.param('price');
    const rangeParam = c.req.query('range') || c.req.param('range');
    const price = priceParam ? parseFloat(priceParam) : NaN;
    const range = rangeParam ? parseFloat(rangeParam) : null;
    if (isNaN(price)) {
      return c.json({
        success: false,
        message: 'Price parameter is required and must be a valid number',
      }, 400);
    }
    let query;
    if (range && !isNaN(range)) {
      query = db
        .select()
        .from(products)
        .where(and(gte(products.price, price), lte(products.price, price + range)))
        .orderBy(products.price);
    } else {
      query = db
        .select()
        .from(products)
        .where(gte(products.price, price))
        .orderBy(products.price);
    }
    const foundProducts = await query.all();
    if (!foundProducts || foundProducts.length === 0) {
      return c.json({
        success: false,
        message: `No products found starting from price ₹${price}`,
      }, 404);
    }
    return c.json({
      success: true,
      message: `Found ${foundProducts.length} products starting from price ₹${price}` + (range ? ` to ₹${price + range}` : ''),
      data: foundProducts,
    });
  } catch (error) {
    console.error('Error fetching products by starting price:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, please try again later',
    }, 500);
  }
};

// Fetch products with discountPercent >= given value, sorted by discountPercent desc, top 4
export const getProductsByMinDiscount = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const discountParam = c.req.query('discount') || c.req.param('discount');
    const minDiscount = discountParam ? parseFloat(discountParam) : NaN;
    if (isNaN(minDiscount)) {
      return c.json({
        success: false,
        message: 'Discount parameter is required and must be a valid number',
      }, 400);
    }
    // Fetch products with discountPercent >= minDiscount, sorted by discountPercent desc
    const productsWithDiscount = await db
      .select()
      .from(products)
      .where(gte(products.discountPercent, minDiscount))
      .orderBy(sql`${products.discountPercent} DESC`)
      .all();
    if (!productsWithDiscount || productsWithDiscount.length === 0) {
      return c.json({
        success: false,
        message: `No products found with discount >= ${minDiscount}%`,
      }, 404);
    }
    // Return top 4 (or all if less than 4)
    const topDiscounted = productsWithDiscount.slice(0, 4);
    return c.json({
      success: true,
      message: `Found ${topDiscounted.length} products with discount >= ${minDiscount}%`,
      data: topDiscounted,
    });
  } catch (error) {
    console.error('Error fetching products by min discount:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, please try again later',
    }, 500);
  }
};

// Fetch top 4 rated products for a given vendorID
export const getTopRatedProductsByVendor = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const vendorID = c.req.query('vendorID') || c.req.param('vendorID');
    if (!vendorID) {
      return c.json({
        success: false,
        message: 'vendorID parameter is required',
      }, 400);
    }
    const topRated = await db
      .select()
      .from(products)
      .where(eq(products.vendorID, vendorID))
      .orderBy(sql`${products.raiting} DESC`)
      .all();
    if (!topRated || topRated.length === 0) {
      return c.json({
        success: false,
        message: `No products found for vendorID '${vendorID}'`,
      }, 404);
    }
    const top4 = topRated.slice(0, 4);
    return c.json({
      success: true,
      message: `Found ${top4.length} top rated products for vendorID '${vendorID}'`,
      data: top4,
    });
  } catch (error) {
    console.error('Error fetching top rated products by vendor:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, please try again later',
    }, 500);
  }
};



export const getProductsByCategory = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    // Accept category as query param (?category=Indoor Plants) or route param
    const category = c.req.query('category') || c.req.param('category');
    if (!category) {
      return c.json({
        success: false,
        message: 'Category parameter is required',
      }, 400);
    }
    const categoryProducts = await db
      .select()
      .from(products)
      .where(eq(products.category, category))
      .all();
    if (!categoryProducts || categoryProducts.length === 0) {
      return c.json({
        success: false,
        message: `No  products found for category '${category}'`,
      }, 404);
    }
    return c.json({
      success: true,
      message: `Found ${categoryProducts.length} products for category '${category}'`,
      data: categoryProducts,
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error, please try again later',
    }, 500);
  }
};