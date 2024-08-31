module.exports = ({ env }) => ({
    graphql: {
        config: {
          endpoint: '/graphql',
          shadowCRUD: true,
          playgroundAlways: true,
          depthLimit: 7,
          amountLimit: 100,
          apolloServer: {
            tracing: true,
          },
        },
      },
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          s3Options: {
            region: env('AWS_REGION'),
            params: {
              Bucket: env('AWS_BUCKET_NAME'),
            },
          }
        },
    }  

    },
    'users-permissions': {
      config: {
        providers: {
          google: {
            enabled: true,
            icon: 'google',
            key: env('GOOGLE_CLIENT_ID'),
            secret: env('GOOGLE_CLIENT_SECRET'),
            callback: `${env('BASE_URL')}/api/connect/google/callback`,
            scope: ['openid', 'email', 'profile'],
          },
          github: {
            enabled: true,
            icon: 'apple',
            key: env('APPLE_CLIENT_ID'),
            secret: env('APPLE_CLIENT_SECRET'),
            callback: `${env('BASE_URL')}/api/connect/github/callback`,
            scope: ['name', 'email'],
            authorize_url: 'https://appleid.apple.com/auth/authorize',
            access_url: 'https://appleid.apple.com/auth/token',
          },
          apple: { // Add Apple provider configuration
            enabled: true,
            icon: 'apple',
            key: env('APPLE_CLIENT_ID'),
            secret: env('APPLE_CLIENT_SECRET'),
            callback: `${env('BASE_URL')}/api/connect/apple/callback`,
            authorize_url: 'https://appleid.apple.com/auth/authorize',
            access_url: 'https://appleid.apple.com/auth/token',
            response_mode: 'form_post',
            scope: ['email'],
          },
        },
      },
    },
  });
  