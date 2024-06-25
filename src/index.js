"use strict";
const axios = require('axios');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { createLogger, format, transports } = require('winston');

// Configure Winston logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}


module.exports = {
  register(/*{ strapi }*/) {},
  async bootstrap({ strapi }) {
    try {
      console.log('Starting bootstrap...');

      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
      });

      const grantConfig = await pluginStore.get({ key: 'grant' });

      const generateAppleClientSecret = () => {
        const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const teamId = process.env.APPLE_TEAM_ID;
        const clientId = process.env.APPLE_CLIENT_ID;
        const keyId = process.env.APPLE_KEY_ID;

        const claims = {
          iss: teamId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 days
          aud: 'https://appleid.apple.com',
          sub: clientId,
        };

        const header = {
          alg: 'ES256',
          kid: keyId,
        };

        return jwt.sign(claims, privateKey, { algorithm: 'ES256', header });
      };

      const appleClientSecret = generateAppleClientSecret();
      console.log('Apple client secret generated.');

      if (grantConfig) {
        console.log('Initial grant config:', grantConfig);
        if (grantConfig.google && grantConfig.google.scope) {
          grantConfig.google.scope = ['openid', 'email', 'profile'];
          await pluginStore.set({ key: 'grant', value: grantConfig });
        }
        if (!grantConfig.apple) {
          grantConfig.apple = {
            enabled: true,
            icon: 'apple',
            key: process.env.APPLE_CLIENT_ID,
            clientSecret: appleClientSecret,
            secret: appleClientSecret,
            callback: `https://identity.blockchainbilliards.io/connect/apple/redirect`,
            authorize_url: `https://appleid.apple.com/auth/authorize`,
            access_url: 'https://appleid.apple.com/auth/token',
            redirect_uri: `https://identity.blockchainbilliards.io/connect/apple/redirect`,
          };
          await pluginStore.set({ key: 'grant', value: grantConfig });
        } else {
          grantConfig.apple.authorize_url = `https://appleid.apple.com/auth/authorize`;
          
          grantConfig.apple.callback = `https://identity.blockchainbilliards.io/connect/apple/redirect`;
          grantConfig.apple.redirect_uri = `https://identity.blockchainbilliards.io/connect/apple/redirect`;
          await pluginStore.set({ key: 'grant', value: grantConfig });
        }
      }
      
      console.log('Updated grant config:', grantConfig);

      

      await strapi
        .service('plugin::users-permissions.providers-registry')
        .register('google', ({ purest }) => async ({ query }) => {
          console.log('Handling Google login...');
          const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${query.access_token}`,
            },
          });

          const { data } = res;
          console.log('Google user data:', data);

          return {
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
            provider: 'google',
            username: data.email,
          };
        });

      console.log('Google provider registered.');

      await strapi
        .service('plugin::users-permissions.providers-registry')
        .register('apple', ({ purest }) => async ({ query }) => {
          strapi.log.info('Handling Apple login...');
          const { code, id_token } = query;

          // Verify the ID token
          const decodedToken = jwt.decode(id_token, { complete: true });

          if (!decodedToken) {
            throw new Error('Unable to decode ID token');
          }

          const { email } = decodedToken.payload;

          strapi.log.info(`Decoded Apple token, email: ${email}`);

          return {
            email,
            provider: 'apple',
            username: email,
          };
        });

        strapi.log.info('Apple provider registered.');

         // Email provider configuration
      const configureEmailProvider = () => {
        const emailService = strapi.plugin('email').service('email');

        emailService.send = async (options) => {
          logger.info('Attempting to send email with options:', options);

          try {
            AWS.config.update({ region: 'us-west-2' }); // Update to your region
            const ses = new AWS.SES();
            const params = {
              Source: 'leif@blockchainbilliards.io',
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

              logger.info('Sending email with params:', params);

              const result = await ses.sendEmail(params).promise();
              logger.info('Email sent successfully:', result);
            } catch (error) {
              logger.error('Error sending email:', error);
              throw error;
            }
          };
        };

        logger.info('Email provider configured2.');


      // Call the email configuration function
      configureEmailProvider();

    } catch (error) {
      console.error('Error during bootstrap:', error);
    }
  },
};
