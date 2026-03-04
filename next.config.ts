import type { NextConfig } from "next";
import withPwaInit from "@ducanh2912/next-pwa";

const withPwa = withPwaInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Ignore API paths so PWA service worker doesn't break API calls
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPwa(nextConfig);
