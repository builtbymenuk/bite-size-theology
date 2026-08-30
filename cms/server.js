// ponytail: entry point for hosts that boot a file instead of running `npm start` (Hostinger web
// apps ask for an "entry file"). Same thing `strapi start` does: boot the compiled output in
// dist/ (tsconfig outDir). Run `npm run build` first, or Strapi reads the .ts config and dies.
const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');

createStrapi({ appDir: __dirname, distDir: path.join(__dirname, 'dist') }).start();
