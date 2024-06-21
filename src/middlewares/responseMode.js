module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
      if (ctx.request.url.includes('/connect/apple')) {
        const url = new URL(ctx.request.url, `https://${ctx.request.header.host}`);
        url.searchParams.set('response_mode', 'form_post');
        ctx.request.url = url.pathname + url.search;
      }
      await next();
    };
  };