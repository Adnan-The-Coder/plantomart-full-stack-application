import { Hono } from 'hono';
import { 
  createProduct, 
  getAllProducts, 
  updateProduct, 
  deleteProduct, 
  getProductById, 
  getProductsByVendor,
  createProductVariant,
  getProductBySlug,
  updateProductVariant,
  deleteProductVariant,
  getFeaturedProducts,
  getFeaturedProductsByCategory,
  getProductsByStartingPrice,
  getProductsByMinDiscount,
  getTopRatedProductsByVendor,
  getProductsByCategory
} from '../controllers/product';
import { createProductCombination, bulkCreateProductCombinations, getProductCombinations, getProductCombination, updateProductCombination, deleteProductCombination, getCombinationsForProduct, deleteProductCombinationsForProduct, getCombinationsContainingProduct } from '../controllers/productCombiner';
import { createProductReview, getReviewByProductID, getProductReview, updateProductReview, deleteProductReview, likeReview, dislikeReview, removeLikeDislike, addReplyToReview, deleteAllReviewsForProduct, getReviewStats, bulkDeleteReviews, getRecentReviews } from '../controllers/ProductReviews';

const productRoutes = new Hono();

productRoutes.post('/create-new', createProduct); 
productRoutes.get('/get-all', getAllProducts);
productRoutes.get('get-products-of/:vendorID',getProductsByVendor);
productRoutes.get('/get/:product_id', getProductById); 
productRoutes.get('/get-by-slug/:slug', getProductBySlug); // NEW: Get product by slug
productRoutes.delete('/delete/:product_id', deleteProduct);
productRoutes.patch('/update/:product_id', updateProduct);
productRoutes.get('/on-category/:category', getProductsByCategory);

// NEW: Variant management routes
productRoutes.post('/variants/create', createProductVariant);
productRoutes.patch('/variants/update/:variant_id', updateProductVariant);
productRoutes.delete('/variants/delete/:variant_id', deleteProductVariant);

// Featured get requests
productRoutes.get('/featured', getFeaturedProducts);
productRoutes.get('/featured-on-category/:category', getFeaturedProductsByCategory);
productRoutes.get('/starting-price', getProductsByStartingPrice);
productRoutes.get('/discounted/:discount?', getProductsByMinDiscount);
productRoutes.get('/top-rated/:vendorID?', getTopRatedProductsByVendor);


// Product review routes
productRoutes.post('/reviews/create', createProductReview);
productRoutes.get('/reviews/product/:productId', getReviewByProductID);
productRoutes.get('/reviews/:id', getProductReview);
productRoutes.patch('/update-review/:id', updateProductReview);
productRoutes.delete('/reviews/:id', deleteProductReview);
productRoutes.post('/reviews/:id/like', likeReview);
productRoutes.post('/reviews/:id/dislike', dislikeReview);
productRoutes.post('/reviews/:id/remove-reaction', removeLikeDislike);
productRoutes.post('/reviews/:id/replies', addReplyToReview);
productRoutes.delete('/reviews/product/:productId', deleteAllReviewsForProduct);
productRoutes.get('/reviews/product/:productId/stats', getReviewStats);
productRoutes.post('/reviews/bulk-delete', bulkDeleteReviews);
productRoutes.get('/reviews/recent', getRecentReviews);

// Product combination routes 
productRoutes.post('/combinations/create', createProductCombination);
productRoutes.post('/combinations/bulk-create', bulkCreateProductCombinations);
productRoutes.get('/combinations', getProductCombinations);
productRoutes.get('/combinations/:id', getProductCombination);
productRoutes.put('/combinations/:id', updateProductCombination);
productRoutes.delete('/combinations/:id', deleteProductCombination);
productRoutes.get('/:productId/combinations', getCombinationsForProduct);
productRoutes.delete('/:productId/combinations', deleteProductCombinationsForProduct);
productRoutes.get('/:productId/containing-combinations', getCombinationsContainingProduct);

export default productRoutes;