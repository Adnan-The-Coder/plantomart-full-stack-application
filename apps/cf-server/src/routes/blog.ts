import { Hono } from 'hono';
import { createBlogPost, getAllBlogs, getBlogBySlug, getBlogsByCategory, updateBlogPost, deleteBlogPost } from "../controllers/blog";

const blogRoutes = new Hono();

blogRoutes.post('/create-post', createBlogPost);
blogRoutes.get('/get-all', getAllBlogs);
blogRoutes.get('/get/:slug', getBlogBySlug);
blogRoutes.get('/category/:category', getBlogsByCategory);
blogRoutes.put('/update/:slug', updateBlogPost);
blogRoutes.delete('/delete/:slug', deleteBlogPost);

export default blogRoutes;