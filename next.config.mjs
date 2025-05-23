/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/borrow",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
