/*const axios = require('axios');
const jwt = require('jsonwebtoken');
const qs = require('qs');

const generateAppleClientSecret = () => {
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const keyId = process.env.APPLE_KEY_ID;

  const claims = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 180),
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };

  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  return jwt.sign(claims, privateKey, { algorithm: 'ES256', header });
};

module.exports = {
  async connect(provider, query) {
    console.log(`Connecting with provider: ${provider}`);
    if (provider === 'google') {
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
    } else if (provider === 'apple') {
      const { code, id_token } = query;

      if (!code && !id_token) {
        throw new Error('No authorization code or ID token found');
      }

      const decodedToken = jwt.decode(id_token, { complete: true });

      if (!decodedToken) {
        throw new Error('Unable to decode ID token');
      }

      const { email } = decodedToken.payload;

      console.log('Decoded Apple token, email:', email);

      const appleClientSecret = generateAppleClientSecret();

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
    }

    throw new Error(`Unsupported provider: ${provider}`);
  },
};
*/