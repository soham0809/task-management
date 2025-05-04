/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/teams',
                destination: '/team',
                permanent: true,
            },
            {
                source: '/teams/:path*',
                destination: '/team/:path*',
                permanent: true,
            }
        ];
    },
};

module.exports = nextConfig; 