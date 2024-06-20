"use strict";
const axios = require('axios');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

module.exports = {
  register(/*{ strapi }*/) {},
  async bootstrap({ strapi }) {
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const grantConfig = await pluginStore.get({ key: 'grant' });

    if (grantConfig) {
      if (grantConfig.google && grantConfig.google.scope) {
        grantConfig.google.scope = ['openid', 'email', 'profile'];
        await pluginStore.set({ key: 'grant', value: grantConfig });
      }
    }
    
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

    await strapi
      .service('plugin::users-permissions.providers-registry')
      .register('google', ({ purest }) => async ({ query }) => {
        const google = purest({ provider: 'google' });

        const res = await google
          .get('https://www.googleapis.com/oauth2/v3/userinfo')
          .auth(query.access_token)
          .request();

        const { body } = res;
        console.log('res', res);

        return {
          email: body.email,
          firstName: body.given_name,
          lastName: body.family_name,
          //picture: body.picture,
          provider: 'google',
          username: body.email,
        };
      });

      // Register Apple provider
      await strapi
      .service('plugin::users-permissions.providers-registry')
      .register('apple', ({ purest }) => async ({ query }) => {
        const { code, id_token } = query;

        // Verify the ID token
        const decodedToken = jwt.decode(id_token, { complete: true });

        if (!decodedToken) {
          throw new Error('Unable to decode ID token');
        }

        // @ts-ignore
        const { email } = decodedToken.payload;

        // Exchange authorization code for access token
        const response = await axios({
          method: 'post',
          url: 'https://appleid.apple.com/auth/token',
          data: qs.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${strapi.config.server.url}/api/connect/apple/callback`,
            client_id: process.env.APPLE_CLIENT_ID,
            client_secret: appleClientSecret,
          }),
        });

        const { access_token } = response.data;

        // Get user info from Apple
        const userInfo = await axios({
          method: 'get',
          url: 'https://appleid.apple.com/auth/token',
          headers: { Authorization: `Bearer ${access_token}` },
        });

        const { givenName, familyName } = userInfo.data;

        return {
          email,
          firstName: givenName,
          lastName: familyName,
          provider: 'apple',
          username: email,
        };
      });
  },
};
