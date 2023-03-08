module.exports = {
    reactStrictMode: true,
    images: {
        domains: [
            "i.ibb.co",
            "ibb.co",
            "assets.coingecko.com",
            "res.cloudinary.com",
            "raw.githubusercontent.com",
            "logos.covalenthq.com",
        ],
    },
    webpack(config) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false, // the solution
        }

        return config
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    i18n: {
        locales: ["en"],
        defaultLocale: "en",
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/exchange/swap",
                permanent: true,
            },
        ]
    },
}

// Don't delete this console log, useful to see the config in Vercel deployments
// console.log('next.config.js', JSON.stringify(module.exports, null, 4))
