import type { NextConfig } from "next";

const config: NextConfig = {
  typescript: { tsconfigPath: "tsconfig.next.json" },
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/pdf": ["./fonts/**/*.ttf"],
    "/api/values": ["./templates/datasheet.tsx"],
  },
};

export default config;
