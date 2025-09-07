import { Hono } from 'hono';
import {  subscribeToNewsletter,submitContactUsForm } from '../controllers/general';

const generalRoutes = new Hono();

generalRoutes.post('/newsletter/subscribe', subscribeToNewsletter);
generalRoutes.post('/contactus',submitContactUsForm);


export default generalRoutes;