'use strict';

/**
 * movie router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;
const defaultRouter = createCoreRouter("api::movie.movie");

const customRoutes = [
    {
      method: 'GET',
      path: '/movies/top-ten',
      handler: 'movie-top-ten.topTen',
      config: {
        policies: [],
      },
    },
  ];


const customRouter = (innerRouter, customRoutes = []) => {
    let routes;
    return {
      get prefix() {
        return innerRouter.prefix;
      },
      get routes() {
        if (!routes) routes = customRoutes.concat(innerRouter.routes);
        return routes;
      },
    };
  };
  
  
  module.exports = customRouter(defaultRouter, customRoutes);
  
