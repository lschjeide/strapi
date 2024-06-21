'use strict';

/**
 * `assign-owner` middleware.
 */

/*module.exports = (config, { strapi }) => {
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
  };*/

  module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
      strapi.log.info(`Middleware triggered for URL: ${ctx.request.url}`);
  
      if (ctx.request.url.includes('/api/connect/apple?')) {
        strapi.log.info('Handling Apple OAuth callback', ctx.request.url);
  
        const parsedUrl = new URL(ctx.request.url, `https://${ctx.request.headers.host}`);
        
        // Check if response_mode=form_post is already present
        if (!parsedUrl.searchParams.get('response_mode') || parsedUrl.searchParams.get('response_mode') !== 'form_post') {
          parsedUrl.searchParams.set('response_mode', 'form_post');
          const updatedUrl = parsedUrl.pathname + parsedUrl.search;
          
          // Prevent infinite loop by checking if the URL is different
          if (ctx.request.url !== updatedUrl) {
            strapi.log.info(`Redirecting to updated URL: ${updatedUrl}`);
            ctx.redirect(updatedUrl);
            return; // Exit to prevent further processing
          }
        }
      }
  
      await next();
  
      strapi.log.info(`After middleware processing for URL: ${ctx.request.url}`);
    };
  };