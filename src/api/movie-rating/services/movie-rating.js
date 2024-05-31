'use strict';

/**
 * movie-rating service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::movie-rating.movie-rating');
