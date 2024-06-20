module.exports = ({ env }) => ({
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
        // These parameters could solve issues with ACL public-read access — see [this issue](https://github.com/strapi/strapi/issues/5868) for details
        actionOptions: {
          upload: {
            ACL: null
          },
          uploadStream: {
            ACL: null
          },
        }
      },
    },
        'users-permissions': {
          config: {
            providers: {
              google: {
                enabled: true,
                icon: 'google',
                key: env('GOOGLE_CLIENT_ID'),
                secret: env('GOOGLE_CLIENT_SECRET'),
                callback: `${env('BASE_URL')}/api/auth/google/callback`,
                scope: ['openid', 'email', 'profile'],
              },
              apple: {
                enabled: true,
                icon: 'apple',
                key: env('APPLE_CLIENT_ID'),
                secret: env('APPLE_CLIENT_SECRET'),
                callback: `${env('BASE_URL')}/api/connect/apple/callback`,
                scope: ['name', 'email'],
                teamId: env('APPLE_TEAM_ID'),
                keyId: env('APPLE_KEY_ID'),
              },
            },
          },
        },
    
  });