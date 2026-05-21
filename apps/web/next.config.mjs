import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@ip/shared", "@ip/vision"],
  serverExternalPackages: ["sharp"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.rub.pub" }],
        destination: "https://rub.pub/:path*",
        permanent: true,
      },
    ];
  },
};
