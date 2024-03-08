'use strict';

/**
 * Module dependencies.
 */

const debug = require('debug')('nsq-lookup');
const request = require('superagent');

/**
 * Parse an array of responses.
 *
 * @param {Array} responses
 * @return {Array}
 * @access private
 */

function parseResponses(responses = []) {
  const nodeSet = new Set();
  const errors = [];
  const dedupedNodes = [];

  for (const [error, nodes = []] of responses) {
    if (error) {
      errors.push(error);
    }

    for (const node of nodes) {
      const addr = `${node.broadcast_address}:${node.tcp_port}`;

      if (nodeSet.has(addr)) {
        debug('already registered');

        continue;
      }

      nodeSet.add(addr);
      dedupedNodes.push(node);
    }
  }

  return [errors, dedupedNodes];
}

/**
 * Lookup topic using an array of nsqlookupd addresses.
 *
 * @param {String[]} addresses
 * @param {Object} options
 * @param {Function|undefined} callback
 * @access public
 */

function lookup(addresses = [], options = {}, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!options.topic) {
    const errors = [new Error('Missing required parameter `options.topic`')];

    return callback ? callback(errors, []) : { errors, nodes: [] };
  }

  options.timeout ||= 20000;
  options.retries ||= 2;

  const promise = Promise.all(
    addresses.map(async address => {
      debug('lookup %s for topic %s', address, options.topic);

      try {
        const response = await request
          .get(`${address}/lookup`)
          .query({ topic: options.topic })
          .timeout(options.timeout)
          .retry(options.retries, (err, res) => res?.status >= 500);

        return [null, response.body?.data?.producers ?? response.body.producers ?? []];
      } catch (error) {
        return [error];
      }
    })
  ).then(responses => {
    const [errors, nodes] = parseResponses(responses);

    debug('errors=%j results=%j', errors, nodes);

    if (!callback) {
      return { errors, nodes };
    }

    callback(errors.length ? errors : null, nodes);
  });

  if (!callback) {
    return promise;
  }
}

/**
 * Export `lookup()`.
 */

module.exports = lookup;
