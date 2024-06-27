'use strict';

/**
 * question-response service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::question-response.question-response');
