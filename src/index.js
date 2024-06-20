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
            secret: process.env.APPLE_CLIENT_SECRET,
            callback: `${process.env.BASE_URL}/api/connect/apple/callback`,
            scope: ['name', 'email'],
            authorize_url: 'https://appleid.apple.com/auth/authorize?response_mode=form_post',
            access_url: 'https://appleid.apple.com/auth/token',
          };
          await pluginStore.set({ key: 'grant', value: grantConfig });
        }
      }
      
      console.log('Updated grant config:', grantConfig);

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
          console.log('Handling Apple login...');
          const { code, id_token } = query;

          // Verify the ID token
          const decodedToken = jwt.decode(id_token, { complete: true });

          if (!decodedToken) {
            throw new Error('Unable to decode ID token');
          }

          const { email } = decodedToken.payload;

          console.log('Decoded Apple token, email:', email);

          // Exchange authorization code for access token
          const response = await axios({
            method: 'post',
            url: 'https://appleid.apple.com/auth/token',
            data: qs.stringify({
              grant_type: 'authorization_code',
              code,
              redirect_uri: `${process.env.BASE_URL}/api/connect/apple/callback`,
              client_id: process.env.APPLE_CLIENT_ID,
              client_secret: appleClientSecret,
            }),
          });

          const { access_token } = response.data;

          console.log('Apple access token:', access_token);

          // Get user info from Apple
          const userInfo = await axios({
            method: 'get',
            url: 'https://appleid.apple.com/auth/keys',
            headers: { Authorization: `Bearer ${access_token}` },
          });

          const { givenName, familyName } = userInfo.data;

          console.log('Apple user info:', userInfo.data);

          return {
            email,
            firstName: givenName,
            lastName: familyName,
            provider: 'apple',
            username: email,
          };
        });

      console.log('Apple provider registered.');
    } catch (error) {
      console.error('Error during bootstrap:', error);
    }
  },
};
