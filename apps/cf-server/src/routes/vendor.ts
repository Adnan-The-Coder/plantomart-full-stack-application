import { Hono } from 'hono';
import {
  vendorRegister,
  updateVendor,
  deleteVendor,
  getAllVendorsPublic,
  getVendorByIdPublic,
  getAllVendorsAdmin,
  getVendorByIdAdmin,
  getVendorBySlugPublic,
} from '../controllers/vendor';

const vendorRoutes = new Hono();

vendorRoutes.post('/register', vendorRegister);
vendorRoutes.patch('/update/:vendor_id', updateVendor);
vendorRoutes.delete('/delete/:vendor_id', deleteVendor);
vendorRoutes.get('/get-all-vendors', getAllVendorsPublic);
vendorRoutes.get('/get/:user_uuid', getVendorByIdPublic );
vendorRoutes.get('/get-by-slug/:slug', getVendorBySlugPublic);

vendorRoutes.get('/get-all-vendors-admin', getAllVendorsAdmin);
vendorRoutes.get('/get-admin/:user_uuid', getVendorByIdAdmin);

export default vendorRoutes;
