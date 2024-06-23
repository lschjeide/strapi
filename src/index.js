"use strict";
const axios = require('axios');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

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
            callback: `https://82e2-98-246-202-159.ngrok-free.app/connect/apple/redirect`,
            authorize_url: `https://appleid.apple.com/auth/authorize`,
            access_url: 'https://appleid.apple.com/auth/token',
            redirect_uri: `https://82e2-98-246-202-159.ngrok-free.app/connect/apple/redirect`,
            response_mode: 'form_data'
          };
          await pluginStore.set({ key: 'grant', value: grantConfig });
        } else {
          grantConfig.apple.authorize_url = `https://appleid.apple.com/auth/authorize`;
          grantConfig.apple.response_mode = `form_data`;
          grantConfig.apple.callback = `https://82e2-98-246-202-159.ngrok-free.app/connect/apple/redirect`;
          grantConfig.apple.redirect_uri = `https://82e2-98-246-202-159.ngrok-free.app/connect/apple/redirect`;
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
            firstName: 'givenName',
            lastName: 'familyName',
            provider: 'apple',
            username: email,
          };
        });

        strapi.log.info('Apple provider registered.');

    } catch (error) {
      console.error('Error during bootstrap:', error);
    }
  },
};
