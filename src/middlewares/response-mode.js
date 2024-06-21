'use strict';
const qs = require('qs');
/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
    // Add your own logic here.
    return async (ctx, next) => {
        // Add Request-Specific Logic here
      strapi.log.info(`In a custom Global middleware, ${ctx.request.url}`);
      if (ctx.request.url.includes('/api/connect/apple/callback')) {
        strapi.log.info('Connecting to Apple Inc', ctx.request.url);
      
      // Check if the response_mode=form_post is already present
      if (!ctx.request.query.response_mode || ctx.request.query.response_mode !== 'form_post') {
        const parsedUrl = new URL(ctx.request.url, `https://${ctx.request.headers.host}`);
        
        // Append response_mode=form_post if not present
        parsedUrl.searchParams.set('response_mode', 'form_post');
        
        // Update ctx.request.url with the new URL
        ctx.request.url = parsedUrl.pathname + parsedUrl.search;
        
        strapi.log.info(`Updated URL, ${ctx.request.url}`);
      }
      }
    ctx.request 
  
      await next();
  
                  // Add Response-Specific Logic here
    };
  };
  