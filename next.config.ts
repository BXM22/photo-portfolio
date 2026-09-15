import type { NextConfig } from "next";

function cdnRemotePattern(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.NEXT_PUBLIC_CDN_URL;
  if (!raw) return [];

  try {
    const url = new URL(raw);
    const protocol =
      url.protocol === "https:"
        ? "https"
        : url.protocol === "http:"
          ? "http"
          : null;
    if (!protocol) return [];
    return [
      {
        protocol,
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cdnRemotePattern(),
  },
};

export default nextConfig;
