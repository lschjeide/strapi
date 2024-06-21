'use strict';

/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {

    if (ctx.request.url.includes('/connect/apple')) {
        if (!ctx.request.url.includes('response_mode=form_post')) {
          const separator = ctx.request.url.includes('?') ? '&' : '?';
          ctx.request.url += `${separator}response_mode=form_post`;
        }
        console.log('Modified URL:', ctx.request.url); // Logging the modified URL
      }
    
    await next();
  };
};
  