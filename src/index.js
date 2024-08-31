"use strict";
const axios = require('axios');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

module.exports = {

  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use(({ nexus }) => {
      const ResponseInput = nexus.inputObjectType({
        name: 'ResponseInput',
        definition(t) {
          t.nonNull.id('survey_question');
          t.nonNull.string('response');
        },
      });

      const createSurveyResponseMutation = nexus.extendType({
        type: 'Mutation',
        definition(t) {
          t.field('createSurveyResponse', {
            type: 'SurveyResponseEntityResponse',
            args: {
              data: nexus.arg({
                type: nexus.inputObjectType({
                  name: 'SurveyResponseInputLeif',
                  definition(t) {
                    t.nonNull.id('users_permissions_user');
                    t.nonNull.id('survey');
                    t.list.field('responses', { type: 'ResponseInput' });
                  },
                }),
              }),
            },
            resolve: async (parent, { data }, context) => {
              const { users_permissions_user, survey, responses } = data;

              // Create survey response
              const surveyResponse = await strapi.services['api::survey-response.survey-response'].create({
                data: {
                  users_permissions_user,
                  survey,
                },
              });

              // Create question responses
              for (const response of responses) {
                await strapi.services['api::question-response.question-response'].create({
                  data: {
                    survey_response: surveyResponse.id,
                    survey_question: response.survey_question,
                    response: response.response,
                  },
                });
              }

              return {
                data: surveyResponse,
              };
            },
          });
        },
      });

      return {
        types: [ResponseInput, createSurveyResponseMutation],
      };
    });
  },
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
        const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
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
            scope: ['email'],
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

          strapi.log.info(`Decoed token: ${JSON.stringify(decodedToken)}`);
          const { email } = decodedToken.payload;

          strapi.log.info(`Decoded Apple token, email: ${email}`);
/*
          // Exchange authorization code for access token
          const response = await axios({
            method: 'post',
            url: 'https://appleid.apple.com/auth/token',
            data: qs.stringify({
              grant_type: 'authorization_code',
              code,
              redirect_uri: `${process.env.BASE_URL}/api/auth/apple/callback`,
              client_id: process.env.APPLE_CLIENT_ID,
              client_secret: appleClientSecret,
            }),
          });

          const { access_token } = response.data;

          strapi.log.info('Apple access token:', access_token);

          // Get user info from Apple
          const userInfo = await axios({
            method: 'get',
            url: 'https://appleid.apple.com/auth/keys',
            headers: { Authorization: `Bearer ${access_token}` },
          });

          const { givenName, familyName } = userInfo.data;

          strapi.log.info('Apple user info:', userInfo.data);*/

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
            } catch (error) {
              throw error;
            }
          };
        };

        strapi.log.info('Email provider configured.');


      // Call the email configuration function
      configureEmailProvider();

    } catch (error) {
      console.error('Error during bootstrap:', error);
    }
  },
};
