import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';

// Strapi 5 lets ANY role holding find/findOne on a draft-and-publish type pass `?status=draft` and
// read unpublished content. The public role has find+findOne on posts (cms/src/index.ts), so every
// draft was readable by anyone. Anonymous callers reach this route with `credentials: null` (the
// users-permissions public role); API tokens and logged-in users carry credentials and keep the
// normal behaviour. Forcing `published` covers the list, the single read, and any other value.
const publishedOnlyForPublic: Core.MiddlewareHandler = async (ctx, next) => {
  if (!ctx.state.auth?.credentials) {
    ctx.query = { ...ctx.query, status: 'published' };
  }
  await next();
};

export default factories.createCoreRouter('api::post.post', {
  config: {
    find: { middlewares: [publishedOnlyForPublic] },
    findOne: { middlewares: [publishedOnlyForPublic] },
  },
});
