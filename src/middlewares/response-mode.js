'use strict';

/**
 * `assign-owner` middleware.
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {

          ctx.request.url += `&response_mode=form_post`;
    
    await next();
  };
};
  