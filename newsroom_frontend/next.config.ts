import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';


const nextConfig: NextConfig = {
    images: {
      domains: [
        "images.unsplash.com",
        "placehold.co",
      ],
  },
};



const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
