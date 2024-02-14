/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    BASE_URL: process.env.BASE_URL,
    ZITADEL_CLIENT_ID: process.env.ZITADEL_CLIENT_ID,
    PUBLIC_NEXT_ZITADEL_API: process.env.PUBLIC_NEXT_ZITADEL_API,
    ZITADEL_API: process.env.ZITADEL_API,
    ORG_ID: process.env.ORG_ID,
    PROJECTID: process.env.PROJECT_ID,
    ZITADEL_API: process.env.ZITADEL_API,
  },
};
