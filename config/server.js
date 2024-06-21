module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('BASE_URL', 'https://strapi.blockchainbilliards.io'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  proxy: {
    enabled: true,
    ssl: true,
  },
  middleware: {
    load: {
      before: ['responseTime', 'logger', 'cors', 'responses', 'gzip'],
      order: [
        'Define the middlewares load order by putting their name in this array is the right order',
      ],
      after: ['parser', 'router'],
    },
    settings: {
      injectResponseMode: {
        enabled: true,
        resolve: './middlewares/inject-response-mode',
      },
    },
  },
});
