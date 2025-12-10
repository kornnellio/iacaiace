/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
