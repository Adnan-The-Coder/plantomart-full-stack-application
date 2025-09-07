// Test script to verify variant functionality
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';

export default {
  async fetch(request, env, ctx) {
    try {
      const db = drizzle(env.DB);
      
      // Test 1: Check if productVariants table exists
      console.log('Testing productVariants table...');
      const tableCheck = await db.select().from(sql`sqlite_master WHERE type='table' AND name='productVariants'`).all();
      console.log('Table check result:', tableCheck);
      
      // Test 2: Check if productVariantGroups table exists
      console.log('Testing productVariantGroups table...');
      const groupsTableCheck = await db.select().from(sql`sqlite_master WHERE type='table' AND name='productVariantGroups'`).all();
      console.log('Groups table check result:', groupsTableCheck);
      
      // Test 3: Try to insert a test variant (if tables exist)
      if (tableCheck.length > 0) {
        console.log('Tables exist, testing insert...');
        // This is just a test - we'll clean it up
        const testVariant = {
          variant_id: `TEST-${Date.now()}`,
          parent_product_id: 'TEST-PRODUCT',
          slug: `test-variant-${Date.now()}`,
          variant_name: 'Test Variant',
          variant_type: 'size',
          price: 100,
          quantity: 10,
          discount_percent: null,
          discount_price: null,
          image_gallery: null,
          description: 'Test variant for verification',
          is_active: true,
        };
        
        console.log('Test variant data:', testVariant);
        
        // Note: This is just for testing - in real usage, we'd check if parent product exists
        const result = await db.insert(sql`productVariants`).values(testVariant);
        console.log('Insert result:', result);
        
        // Clean up test data
        await db.delete(sql`productVariants`).where(sql`variant_id = ${testVariant.variant_id}`);
        console.log('Test data cleaned up');
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Variant tables verified successfully',
        tables: {
          productVariants: tableCheck.length > 0,
          productVariantGroups: groupsTableCheck.length > 0
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Test failed:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Test failed',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}; 