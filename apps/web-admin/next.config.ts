import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
            domains: ['lh3.googleusercontent.com','images.unsplash.com','example.com'],
            unoptimized: true,
          }
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();