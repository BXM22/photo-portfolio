import type { NextConfig } from "next";

// ============================================================================
// LEARNING NOTE: `next/image` refuses to optimize images from a domain it
// doesn't explicitly trust — this is a deliberate security measure (an
// "open" image proxy could otherwise be abused to fetch/relay arbitrary
// URLs). Since our photos live in S3 and are served through CloudFront
// (see docs/SETUP.md), we have to allow-list those hostnames here.
// ============================================================================

const cdnHostname = process.env.NEXT_PUBLIC_CDN_URL
  ? new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Direct S3 URLs (used as a fallback before you've set up CloudFront
      // — see publicUrlForKey() in src/lib/s3.ts).
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      // Your CloudFront distribution's default domain, if you haven't
      // pointed a custom domain at it.
      { protocol: "https", hostname: "*.cloudfront.net" },
      // Your own custom CDN domain, if NEXT_PUBLIC_CDN_URL is set to one.
      ...(cdnHostname ? [{ protocol: "https" as const, hostname: cdnHostname }] : []),
    ],
  },
};

export default nextConfig;
