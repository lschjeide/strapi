'use strict';

/**
 * movie-rating controller
 */

const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController('api::movie-rating.movie-rating', ({ strapi }) => ({
    async create(ctx) {
      // Retrieve the user from the context (JWT token)
      const user = ctx.state.user;
      const { imdbID, rating } = ctx.request.body.data;

      if (!user) {
        return ctx.unauthorized('You must be logged in to create an movie rating.');
      }

      let movie = await strapi.db.query('api::movie.movie').findOne({
        where: { imdbID },
      });

      // If the movie is not found, create a new movie
      if (!movie) {
        movie = await strapi.entityService.create('api::movie.movie', {
          data: { imdbID },
        });
      }

      const existingRating = await strapi.db.query('api::movie-rating.movie-rating').findOne({
        where: { user: user.id, movie: movie.id },
      });
  
      
      // Attach the user to the request body
      ctx.request.body.data.user = user.id;
      ctx.request.body.data.movie = movie.id;

      if (existingRating) {
        // If the existing rating is found, update it with the new rating
        const updatedRating = await strapi.entityService.update('api::movie-rating.movie-rating', existingRating.id, {
          data: { rating },
        });
        return ctx.send({ message: 'Rating updated successfully', data: updatedRating });
      }
  
      // Call the default core action
      const response = await super.create(ctx);
      return response;
    },
  }));