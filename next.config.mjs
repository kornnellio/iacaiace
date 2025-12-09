/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'iacaiace.ro',
                pathname: '/uploads/**',
            },
        ],
    },
}

export default nextConfig
