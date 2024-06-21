module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.request.url.includes('/connect/apple')) {
      if (!ctx.request.url.includes('response_mode=form_post')) {
        const separator = ctx.request.url.includes('?') ? '&' : '?';
        ctx.request.url += `${separator}response_mode=form_post`;
      }
      console.log('Modified URL:', ctx.request.url); // Logging the modified URL
    }
    console.log('outside if');
    await next();
  };
};