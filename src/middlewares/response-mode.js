'use strict';
const qs = require('qs');
/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
    // Add your own logic here.
    return async (ctx, next) => {
        // Add Request-Specific Logic here
      strapi.log.info('In a custom Global middleware.', ctx.request.url);
      if (ctx.request.url.includes('/connect/apple')) {
        strapi.log.info('Connecting to Apple Inc', ctx.request.url);
        if (!ctx.request.url.includes('response_mode=form_post')) {
            const separator = ctx.request.url.includes('?') ? '&' : '?';
            ctx.request.url = qs.stringify(`${ctx.request.url}${separator}response_mode=form_post`);

        strapi.log.info(`Updated url, ${ctx.request.url}`);
          }
      }
    ctx.request 
  
      await next();
  
                  // Add Response-Specific Logic here
    };
  };
  