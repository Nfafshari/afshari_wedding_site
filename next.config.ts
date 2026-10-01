import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.0.32"],
  experimental: {
    serverActions: {
      // Server Actions reject bodies over 1 MB by default, too small for a scanned
      // contract. Files are capped at 4 MB (MAX_DOC_SIZE_BYTES in
      // planner/doc-archive/data.ts); the extra half MB covers the multipart
      // encoding and other fields, and is Vercel's hard request-body cap.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
