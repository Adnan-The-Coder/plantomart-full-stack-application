import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray } from 'drizzle-orm';
import { productCombinations, products } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// Interface for child product structure
interface ChildProduct {
  product_id: string;
  quantity: number;
}

// Validation helper for child products
const validateChildProducts = (childProducts: any[]): boolean => {
  if (!Array.isArray(childProducts) || childProducts.length === 0) {
    return false;
  }

  return childProducts.every(item => 
    item &&
    typeof item === 'object' &&
    typeof item.product_id === 'string' &&
    item.product_id.trim() !== '' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    Number.isInteger(item.quantity)
  );
};

// Create a new product combination
export const createProductCombination = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const { 
      parent_product_id, 
      combination_name, 
      description, 
      child_products 
    } = body;

    // Validate required fields
    if (!parent_product_id || !combination_name || !child_products) {
      return c.json(
        {
          success: false,
          message: 'Parent product ID, combination name, and child products are required'
        },
        400
      );
    }

    // Validate child products structure
    if (!validateChildProducts(child_products)) {
      return c.json(
        {
          success: false,
          message: 'Child products must be an array of objects with product_id (string) and quantity (positive integer)'
        },
        400
      );
    }

    // Check if parent product exists
    const parentProduct = await db
      .select()
      .from(products)
      .where(eq(products.product_id, parent_product_id))
      .limit(1);

    if (parentProduct.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Parent product not found'
        },
        404
      );
    }

    // Verify all child products exist
    const childProductIds = child_products.map((cp: ChildProduct) => cp.product_id);
    const existingChildProducts = await db
      .select({ product_id: products.product_id })
      .from(products)
      .where(inArray(products.product_id, childProductIds));

    const existingIds = existingChildProducts.map(p => p.product_id);
    const missingProducts = childProductIds.filter((id: string) => !existingIds.includes(id));

    if (missingProducts.length > 0) {
      return c.json(
        {
          success: false,
          message: `Child products not found: ${missingProducts.join(', ')}`
        },
        404
      );
    }

    // Generate unique combination ID
    const combinationId = uuidv4();

    // Insert new product combination
    const result = await db
      .insert(productCombinations)
      .values({
        combination_id: combinationId,
        parent_product_id: parent_product_id.trim(),
        combination_name: combination_name.trim(),
        description: description?.trim() || null,
        child_products: JSON.stringify(child_products),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning();

    return c.json({
      success: true,
      message: 'Product combination created successfully!',
      data: {
        ...result[0],
        child_products: JSON.parse(result[0].child_products as string)
      }
    }, 201);

  } catch (error) {
    console.error('Create product combination error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json(
        {
          success: false,
          message: 'A combination with this ID already exists'
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

// Get all product combinations with optional filtering
export const getProductCombinations = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { parent_product_id, combination_name } = c.req.query();

    // Start with base query
    const baseQuery = db.select().from(productCombinations);
    
    // Build conditions array
    const conditions = [];
    if (parent_product_id) {
      conditions.push(eq(productCombinations.parent_product_id, parent_product_id));
    }
    if (combination_name) {
      conditions.push(eq(productCombinations.combination_name, combination_name));
    }

    // Execute query with conditions
    const results = conditions.length > 0 
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    // Parse child_products JSON for each result
    const formattedResults = results.map(combination => ({
      ...combination,
      child_products: JSON.parse(combination.child_products as string)
    }));

    return c.json({
      success: true,
      message: 'Product combinations retrieved successfully',
      data: formattedResults,
      count: formattedResults.length
    });

  } catch (error) {
    console.error('Get product combinations error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get a single product combination by ID
export const getProductCombination = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Combination ID is required'
        },
        400
      );
    }

    const result = await db
      .select()
      .from(productCombinations)
      .where(eq(productCombinations.combination_id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product combination not found'
        },
        404
      );
    }

    const combination = {
      ...result[0],
      child_products: JSON.parse(result[0].child_products as string)
    };

    return c.json({
      success: true,
      message: 'Product combination retrieved successfully',
      data: combination
    });

  } catch (error) {
    console.error('Get product combination error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Update an existing product combination
export const updateProductCombination = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { 
      parent_product_id, 
      combination_name, 
      description, 
      child_products 
    } = body;

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Combination ID is required'
        },
        400
      );
    }

    // Check if combination exists
    const existingCombination = await db
      .select()
      .from(productCombinations)
      .where(eq(productCombinations.combination_id, id))
      .limit(1);

    if (existingCombination.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product combination not found'
        },
        404
      );
    }

    // Validate child products if provided
    if (child_products && !validateChildProducts(child_products)) {
      return c.json(
        {
          success: false,
          message: 'Child products must be an array of objects with product_id (string) and quantity (positive integer)'
        },
        400
      );
    }

    // If parent_product_id is being updated, verify it exists
    if (parent_product_id) {
      const parentProduct = await db
        .select()
        .from(products)
        .where(eq(products.product_id, parent_product_id))
        .limit(1);

      if (parentProduct.length === 0) {
        return c.json(
          {
            success: false,
            message: 'Parent product not found'
          },
          404
        );
      }
    }

    // If child_products is being updated, verify all child products exist
    if (child_products) {
      const childProductIds = child_products.map((cp: ChildProduct) => cp.product_id);
      const existingChildProducts = await db
        .select({ product_id: products.product_id })
        .from(products)
        .where(inArray(products.product_id, childProductIds));

      const existingIds = existingChildProducts.map(p => p.product_id);
      const missingProducts = childProductIds.filter((productId: string) => !existingIds.includes(productId));

      if (missingProducts.length > 0) {
        return c.json(
          {
            success: false,
            message: `Child products not found: ${missingProducts.join(', ')}`
          },
          404
        );
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (parent_product_id) updateData.parent_product_id = parent_product_id.trim();
    if (combination_name) updateData.combination_name = combination_name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (child_products) updateData.child_products = JSON.stringify(child_products);

    // Perform update
    const result = await db
      .update(productCombinations)
      .set(updateData)
      .where(eq(productCombinations.combination_id, id))
      .returning();

    const updatedCombination = {
      ...result[0],
      child_products: JSON.parse(result[0].child_products as string)
    };

    return c.json({
      success: true,
      message: 'Product combination updated successfully!',
      data: updatedCombination
    });

  } catch (error) {
    console.error('Update product combination error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Delete a product combination
export const deleteProductCombination = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Combination ID is required'
        },
        400
      );
    }

    // Check if combination exists
    const existingCombination = await db
      .select()
      .from(productCombinations)
      .where(eq(productCombinations.combination_id, id))
      .limit(1);

    if (existingCombination.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Product combination not found'
        },
        404
      );
    }

    // Delete the combination
    await db
      .delete(productCombinations)
      .where(eq(productCombinations.combination_id, id));

    return c.json({
      success: true,
      message: 'Product combination deleted successfully!'
    });

  } catch (error) {
    console.error('Delete product combination error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get all combinations for a specific parent product
export const getCombinationsForProduct = async (c: Context) => {
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

    // Check if parent product exists
    const parentProduct = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .limit(1);

    if (parentProduct.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Parent product not found'
        },
        404
      );
    }

    const results = await db
      .select()
      .from(productCombinations)
      .where(eq(productCombinations.parent_product_id, productId));

    // Parse child_products JSON for each result
    const formattedResults = results.map(combination => ({
      ...combination,
      child_products: JSON.parse(combination.child_products as string)
    }));

    return c.json({
      success: true,
      message: 'Product combinations retrieved successfully',
      data: formattedResults,
      count: formattedResults.length
    });

  } catch (error) {
    console.error('Get combinations for product error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Bulk create multiple product combinations
export const bulkCreateProductCombinations = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const { combinations } = body;

    if (!Array.isArray(combinations) || combinations.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Combinations array is required and must not be empty'
        },
        400
      );
    }

    // Validate each combination
    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      
      if (!combo.parent_product_id || !combo.combination_name || !combo.child_products) {
        return c.json(
          {
            success: false,
            message: `Combination at index ${i}: Parent product ID, combination name, and child products are required`
          },
          400
        );
      }

      if (!validateChildProducts(combo.child_products)) {
        return c.json(
          {
            success: false,
            message: `Combination at index ${i}: Invalid child products format`
          },
          400
        );
      }
    }

    // Verify all parent products exist
    const parentProductIds = [...new Set(combinations.map(c => c.parent_product_id))];
    const existingParentProducts = await db
      .select({ product_id: products.product_id })
      .from(products)
      .where(inArray(products.product_id, parentProductIds));

    const existingParentIds = existingParentProducts.map(p => p.product_id);
    const missingParentProducts = parentProductIds.filter(id => !existingParentIds.includes(id));

    if (missingParentProducts.length > 0) {
      return c.json(
        {
          success: false,
          message: `Parent products not found: ${missingParentProducts.join(', ')}`
        },
        404
      );
    }

    // Verify all child products exist
    const allChildProductIds = [...new Set(combinations.flatMap(c => c.child_products.map((cp: ChildProduct) => cp.product_id)))];
    const existingChildProducts = await db
      .select({ product_id: products.product_id })
      .from(products)
      .where(inArray(products.product_id, allChildProductIds));

    const existingChildIds = existingChildProducts.map(p => p.product_id);
    const missingChildProducts = allChildProductIds.filter(id => !existingChildIds.includes(id));

    if (missingChildProducts.length > 0) {
      return c.json(
        {
          success: false,
          message: `Child products not found: ${missingChildProducts.join(', ')}`
        },
        404
      );
    }

    // Prepare data for bulk insert
    const insertData = combinations.map(combo => ({
      combination_id: uuidv4(),
      parent_product_id: combo.parent_product_id.trim(),
      combination_name: combo.combination_name.trim(),
      description: combo.description?.trim() || null,
      child_products: JSON.stringify(combo.child_products),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Bulk insert
    const results = await db
      .insert(productCombinations)
      .values(insertData)
      .returning();

    // Format results
    const formattedResults = results.map(combination => ({
      ...combination,
      child_products: JSON.parse(combination.child_products as string)
    }));

    return c.json({
      success: true,
      message: `${results.length} product combinations created successfully!`,
      data: formattedResults,
      count: results.length
    }, 201);

  } catch (error) {
    console.error('Bulk create product combinations error:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json(
        {
          success: false,
          message: 'One or more combinations with duplicate IDs already exist'
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

// Delete all combinations for a specific parent product
export const deleteProductCombinationsForProduct = async (c: Context) => {
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

    // Check if parent product exists
    const parentProduct = await db
      .select()
      .from(products)
      .where(eq(products.product_id, productId))
      .limit(1);

    if (parentProduct.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Parent product not found'
        },
        404
      );
    }

    // Get existing combinations count
    const existingCombinations = await db
      .select({ count: productCombinations.id })
      .from(productCombinations)
      .where(eq(productCombinations.parent_product_id, productId));

    const deletedCount = existingCombinations.length;

    // Delete all combinations for this product
    await db
      .delete(productCombinations)
      .where(eq(productCombinations.parent_product_id, productId));

    return c.json({
      success: true,
      message: `${deletedCount} product combinations deleted successfully!`,
      deletedCount
    });

  } catch (error) {
    console.error('Delete product combinations for product error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};

// Get combinations that include a specific product as a child
export const getCombinationsContainingProduct = async (c: Context) => {
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

    // Get all combinations and filter by child products containing the specified product
    const allCombinations = await db.select().from(productCombinations);
    
    const matchingCombinations = allCombinations.filter(combination => {
      const childProducts = JSON.parse(combination.child_products as string) as ChildProduct[];
      return childProducts.some(cp => cp.product_id === productId);
    });

    // Format results
    const formattedResults = matchingCombinations.map(combination => ({
      ...combination,
      child_products: JSON.parse(combination.child_products as string)
    }));

    return c.json({
      success: true,
      message: 'Product combinations containing the specified product retrieved successfully',
      data: formattedResults,
      count: formattedResults.length
    });

  } catch (error) {
    console.error('Get combinations containing product error:', error);
    return c.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      500
    );
  }
};