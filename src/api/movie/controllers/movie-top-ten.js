'use strict';

/**
 * A set of functions called "actions" for `movie`
 */

module.exports = {
  async topTen(ctx) {
    try {
      // Fetch movies with their ratings

      const movies = await strapi.query('api::movie.movie').findMany({
        populate: ['movie_ratings'],
      });

      // Calculate the weighted score for each movie
      const movieScores = movies.map(movie => {
        const ratings = movie.movie_ratings || [];
        const numRatings = ratings.length;
        const avgRating = numRatings > 0 ? ratings.reduce((acc, movie_rating) => acc + movie_rating.rating, 0) / numRatings : 0;

        // Weight the average rating by the number of ratings
        const weightedScore = avgRating * Math.log(numRatings + 1);

        return {
          ...movie,
          avgRating,
          numRatings,
          weightedScore,
        };
      });

      // Sort movies by their weighted score in descending order
      const sortedMovies = movieScores.sort((a, b) => b.weightedScore - a.weightedScore);

      // Get the top 10 movies
      const topTenMovies = sortedMovies.slice(0, 10);
      
      ctx.send(topTenMovies);
    } catch (error) {
      ctx.send({ error: 'An error occurred' });
    }
  },
};