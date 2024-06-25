const AWS = require('aws-sdk');
const logger = require('../utils/logger');

logger.info('Loading plugins configuration');
module.exports = ({ env }) => {
    logger.info('Configuring email provider');
  return {
    email: {
        provider: 'custom',
        providerOptions: {},
        settings: {
          defaultFrom: 'leif@blockchainbilliards.io',
          defaultReplyTo: 'leif@blockchainbilliards.io',
        },
        send: async (options) => {
          logger.info('Sending email with the following options:', options);
    
          try {
            AWS.config.update({ region: 'us-west-2' }); // Update to your region
            const ses = new AWS.SES();
            const params = {
              Source: options.from,
              Destination: {
                ToAddresses: [options.to],
              },
              Message: {
                Subject: {
                  Data: options.subject,
                },
                Body: {
                  Html: {
                    Data: options.html,
                  },
                  Text: {
                    Data: options.text,
                  },
                },
              },
            };
    
            const result = await ses.sendEmail(params).promise();
            logger.info('Email sent successfully:', result);
          } catch (error) {
            logger.error('Error sending email:', error);
            throw error;
          }
        },
      },
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET_NAME'),
        },
      },
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
          callback: `${env('BASE_URL')}/api/connect/google/callback`,
          scope: ['openid', 'email', 'profile'],
        },
        github: {
          enabled: true,
          icon: 'github',
          key: env('GITHUB_CLIENT_ID'),
          secret: env('GITHUB_CLIENT_SECRET'),
          callback: `${env('BASE_URL')}/api/connect/github/callback`,
          scope: ['user', 'email'],
        },
        apple: {
          enabled: true,
          icon: 'apple',
          key: env('APPLE_CLIENT_ID'),
          secret: env('APPLE_CLIENT_SECRET'),
          callback: `${env('BASE_URL')}/api/connect/apple/callback`,
          authorize_url: 'https://appleid.apple.com/auth/authorize',
          access_url: 'https://appleid.apple.com/auth/token',
          response_mode: 'form_post',
        },
      },
    },
  },
}
};
