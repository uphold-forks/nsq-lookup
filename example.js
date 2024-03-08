/**
 * Module dependencies.
 */

const lookup = require('./');

const addresses = ['http://0.0.0.0:4161', 'http://0.0.0.0:4162', 'http://0.0.0.0:4161'];
const options = { timeout: 10000 };

// Callback style.
lookup(addresses, options, function (errors, nodes) {
  console.error(errors, nodes);
});

// Promise style.
(async () => {
  const { errors, nodes } = await lookup(addresses, options);

  console.error(errors, nodes);
})();
