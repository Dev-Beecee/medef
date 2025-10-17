/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://seeph-medef-martinique.fr",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    "/ghost",
    "/ghost-dashboard",
    "/ghost-dashboard/*",
    "/participation-confirmation",
    "/vote-confirmation",
    "/api/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/ghost",
          "/ghost-dashboard",
          "/ghost-dashboard/*",
          "/participation-confirmation",
          "/vote-confirmation",
          "/api/*",
        ],
      },
    ],
    additionalSitemaps: ["https://seeph-medef-martinique.fr/sitemap.xml"],
  },
  transform: async (config, path) => {
    // Personnaliser les métadonnées pour certaines pages
    const customPaths = {
      "/": {
        changefreq: "weekly",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      },
      "/participation": {
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
      "/vote": {
        changefreq: "monthly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      },
    };

    return {
      loc: path,
      changefreq: customPaths[path]?.changefreq || "monthly",
      priority: customPaths[path]?.priority || 0.5,
      lastmod: customPaths[path]?.lastmod || new Date().toISOString(),
    };
  },
};
