import { customAlphabet } from 'nanoid';
import { eq } from 'drizzle-orm';
import { vendorProfiles } from '../db/schema'; // Adjust to your structure
import { drizzle } from 'drizzle-orm/d1'; // Adjust if using different driver
import type { Context } from 'hono';

// Create a custom nanoid generator: 8 characters, A-Z + 0-9
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

export const vendorRegister = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();

    const {
      user_uuid, name,
      description, banner_image, logo,
      image_gallery, rating,
      about_us, features,
      business_name, business_address,
      business_registration_number,
      gstin_number, pan_number,
      legal_structure, contact_person_name,
      contact_email, contact_phone,
      bank_account_number, bank_name,
      ifsc_code, shipping_fee_mode,
      gst_rate, return_policy,
      shipping_policy, privacy_policy,
      seller_terms, business_license,
      identity_verification, is_verified,
      status,
    } = body;

    // Validate required fields
    if (!user_uuid || !name || !contact_email) {
      return c.json({
        success: false,
        message: 'Missing required fields: user_uuid, name, contact_email',
      }, 400);
    }

    // Prevent duplicate vendor registration for same user_uuid
    const existingVendor = await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.user_uuid, user_uuid))
      .limit(1)
      .then(res => res.at(0));

    if (existingVendor) {
      return c.json({
        success: false,
        message: `A vendor profile already exists for this user_uuid. Duplicate registrations are not allowed.`,
      }, 409);
    }

    // Generate a unique slug
    let slug: string;
    let isSlugUnique = false;
    do {
      slug = `vendor-${nanoid(10)}`;
      const slugExists = await db
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.slug, slug))
        .limit(1)
        .then(res => res.length > 0);
      if (!slugExists) isSlugUnique = true;
    } while (!isSlugUnique);

    // Generate vendor_id
    const vendorID = `VND-${nanoid()}`;
    const now = new Date().toISOString();

    // Insert new vendor profile
    await db.insert(vendorProfiles).values({
      user_uuid,
      vendor_id: vendorID,
      slug,
      name,
      description,
      banner_image,
      logo,
      image_gallery: image_gallery ? JSON.stringify(image_gallery) : null,
      rating,
      about_us,
      features: features ? JSON.stringify(features) : null,
      business_name,
      business_address,
      business_registration_number,
      gstin_number,
      pan_number,
      legal_structure,
      contact_person_name,
      contact_email,
      contact_phone,
      bank_account_number,
      bank_name,
      ifsc_code,
      shipping_fee_mode,
      gst_rate,
      return_policy,
      shipping_policy,
      privacy_policy,
      seller_terms,
      business_license,
      identity_verification,
      is_verified: is_verified ?? 0,
      status: status ?? 'pending',
      created_at: now,
      updated_at: now,
    });

    return c.json({
      success: true,
      message: 'Vendor registered successfully.',
      data: {
        vendor_id: vendorID,
        slug,
        name,
      },
    });

  } catch (error) {
    console.error('Error registering vendor:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};



// UPDATE VENDOR
export const updateVendor = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const vendorID = c.req.param('vendor_id');
    const fieldsToUpdate = await c.req.json();

    if (!vendorID || Object.keys(fieldsToUpdate).length === 0) {
      return c.json({
        success: false,
        message: 'Vendor ID and at least one field to update are required.',
      }, 400);
    }

    const result = await db
      .update(vendorProfiles)
      .set(fieldsToUpdate)
      .where(eq(vendorProfiles.id, Number(vendorID)))
      .run() as any;

    if (result.rowsAffected === 0) {
      return c.json({
        success: false,
        message: `No vendor found with ID ${vendorID} or nothing changed.`,
      }, 404);
    }

    return c.json({
      success: true,
      message: `Vendor with ID ${vendorID} updated successfully.`,
      data: result,
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// DELETE VENDOR
export const deleteVendor = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const vendorID = c.req.param('vendor_id');

    if (!vendorID) {
      return c.json({
        success: false,
        message: 'Vendor ID is required',
      }, 400);
    }

    const deleted = await db
      .delete(vendorProfiles)
      .where(eq(vendorProfiles.id, Number(vendorID)))
      .run();

    return c.json({
      success: true,
      message: `Vendor with ID ${vendorID} deleted successfully.`,
      data: deleted,
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET ALL VENDORS - ADMIN
export const getAllVendorsAdmin = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const vendors = await db.select().from(vendorProfiles).all();

    return c.json({
      success: true,
      message: `Fetched ${vendors.length} vendors (admin)`,
      data: vendors,
    });

  } catch (error) {
    console.error('Error fetching vendors (admin):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET ALL VENDORS - PUBLIC (Safe Fields Only)
export const getAllVendorsPublic = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const vendors = await db.select().from(vendorProfiles).all();

    const safeVendors = vendors.map(({ id, slug, name, description, banner_image, logo, image_gallery, rating, about_us, features, business_name, business_address, contact_person_name, contact_email, contact_phone, return_policy, shipping_policy, privacy_policy, seller_terms, is_verified, status }) => ({
      id,
      slug,
      name,
      description,
      banner_image,
      logo,
      image_gallery,
      rating,
      about_us,
      features,
      business_name,
      business_address,
      contact_person_name,
      contact_email,
      contact_phone,
      return_policy,
      shipping_policy,
      privacy_policy,
      seller_terms,
      is_verified,
      status,
    }));

    return c.json({
      success: true,
      message: `Fetched ${safeVendors.length} vendors (public)`,
      data: safeVendors,
    });

  } catch (error) {
    console.error('Error fetching vendors (public):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET VENDOR BY ID - ADMIN
export const getVendorByIdAdmin = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const userUUID = c.req.param('user_uuid');

    const vendor = await db.select().from(vendorProfiles).where(eq(vendorProfiles.user_uuid, userUUID)).get();

    if (!vendor) {
      return c.json({
        success: false,
        message: `Vendor with user ID ${userUUID} not found`,
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Vendor fetched successfully (admin)',
      data: vendor,
    });

  } catch (error) {
    console.error('Error fetching vendor by ID (admin):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET VENDOR BY ID - PUBLIC
export const getVendorByIdPublic = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const userUUID = c.req.param('user_uuid');
    console.log('Fetching vendor with ID:', userUUID);

    const vendor = await db.select().from(vendorProfiles).where(eq(vendorProfiles.user_uuid, userUUID)).get();

    if (!vendor) {
      return c.json({
        success: false,
        message: `Vendor with user ID ${userUUID} not found`,
      }, 404);
    }

    const {
      id,
      slug,
      name,
      description,
      banner_image,
      logo,
      image_gallery,
      rating,
      about_us,
      features,
      business_name,
      business_address,
      contact_person_name,
      contact_email,
      contact_phone,
      return_policy,
      shipping_policy,
      privacy_policy,
      seller_terms,
      is_verified,
      status
    } = vendor;

    return c.json({
      success: true,
      message: 'Vendor fetched successfully (public)',
      data: {
        id,
        slug,
        name,
        description,
        banner_image,
        logo,
        image_gallery,
        rating,
        about_us,
        features,
        business_name,
        business_address,
        contact_person_name,
        contact_email,
        contact_phone,
        return_policy,
        shipping_policy,
        privacy_policy,
        seller_terms,
        is_verified,
        status
      }
    });

  } catch (error) {
    console.error('Error fetching vendor by ID (public):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};

// GET VENDOR BY SLUG - PUBLIC
export const getVendorBySlugPublic = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const slug = c.req.param('slug');
    console.log('Fetching vendor with slug:', slug);

    if (!slug) {
      return c.json({
        success: false,
        message: 'Slug parameter is required',
      }, 400);
    }

    const vendor = await db.select().from(vendorProfiles).where(eq(vendorProfiles.slug, slug)).get();

    if (!vendor) {
      return c.json({
        success: false,
        message: `Vendor with slug '${slug}' not found`,
      }, 404);
    }

    const {
      id,
      vendor_id,
      user_uuid,
      slug: vendorSlug,
      name,
      description,
      banner_image,
      logo,
      image_gallery,
      rating,
      about_us,
      features,
      business_name,
      business_address,
      contact_person_name,
      contact_email,
      contact_phone,
      return_policy,
      shipping_policy,
      privacy_policy,
      seller_terms,
      is_verified,
      status,
      created_at,
      updated_at
    } = vendor;

    return c.json({
      success: true,
      message: 'Vendor fetched successfully by slug (public)',
      data: {
        id,
        vendor_id,
        slug: vendorSlug,
        name,
        description,
        banner_image,
        logo,
        image_gallery,
        rating,
        about_us,
        features,
        business_name,
        business_address,
        contact_person_name,
        contact_email,
        contact_phone,
        return_policy,
        shipping_policy,
        privacy_policy,
        seller_terms,
        is_verified,
        status,
        created_at,
        updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching vendor by slug (public):', error);
    return c.json({
      success: false,
      message: 'Internal Server Error',
    }, 500);
  }
};