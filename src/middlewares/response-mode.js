'use strict';

/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
    // Add your own logic here.
    return async (ctx, next) => {
        // Add Request-Specific Logic here
      strapi.log.info('In a custom Global middleware.');
                  ctx.request 
  
      await next();
  
                  // Add Response-Specific Logic here
    };
  };
  