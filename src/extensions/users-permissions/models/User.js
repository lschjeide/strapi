module.exports = {
    lifecycles: {
      async beforeCreate(data) {
        if (data.email) {
          data.confirmed = false; // Ensure the user is not confirmed upon creation
        }
      },
      async afterCreate(result, data) {
        if (data.email) {
          try {
            await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(result);
          } catch (err) {
            strapi.log.error(err);
          }
        }
      },
    },
  };
  