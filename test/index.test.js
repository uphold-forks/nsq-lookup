'use strict';

/**
 * Module dependencies.
 */

const { after, before, describe, it } = require('node:test');
const assert = require('node:assert');
const lookup = require('..');
const request = require('superagent');

/**
 * Module constants.
 */

const lookupAddress = '127.0.0.1:4161';
const nsqAddress = '127.0.0.1:4151';

/**
 * Test.
 */

describe('nsq-lookup', () => {
  const topic = 'topic';

  let isOldNsq;

  before(async () => {
    const nsqInfo = await request.get(`${lookupAddress}/info`);

    await request.post(`${nsqAddress}/topic/create`).query({ topic });

    isOldNsq = !!nsqInfo.body?.data?.version;
  });

  after(async () => {
    await request.post(`${nsqAddress}/topic/delete`).query({ topic });
  });

  describe('using callback', () => {
    it('should return errors if the topic is missing', (_, done) => {
      lookup([lookupAddress], {}, (errors, nodes) => {
        assert.equal(errors[0].message, 'Missing required parameter `options.topic`');
        assert.deepEqual(nodes, []);
        done();
      });
    });

    it('should return errors returned from the lookup', (_, done) => {
      lookup([lookupAddress], { topic: 'foo' }, (errors, nodes) => {
        if (isOldNsq) {
          assert.equal(errors[0].response.body.status_txt, 'TOPIC_NOT_FOUND');
        } else {
          assert.equal(errors[0].response.body.message, 'TOPIC_NOT_FOUND');
        }

        assert.deepEqual(nodes, []);
        done();
      });
    });

    it('should return nodes returned from the lookup', (_, done) => {
      lookup([lookupAddress], { topic }, (errors, nodes) => {
        assert.equal(errors, null);
        assert.equal(nodes.length, 1);
        assert.equal(nodes[0].broadcast_address, '127.0.0.1');
        assert.equal(nodes[0].tcp_port, 4150);
        assert.equal(nodes[0].http_port, 4151);
        done();
      });
    });
  });

  describe('using promises', () => {
    it('should throw an error if the topic is missing', async () => {
      const { errors, nodes } = await lookup([lookupAddress], {});

      assert.equal(errors[0].message, 'Missing required parameter `options.topic`');
      assert.deepEqual(nodes, []);
    });

    it('should return errors returned from the lookup', async () => {
      const { errors, nodes } = await lookup([lookupAddress], { topic: 'foo' });

      if (isOldNsq) {
        assert.equal(errors[0].response.body.status_txt, 'TOPIC_NOT_FOUND');
      } else {
        assert.equal(errors[0].response.body.message, 'TOPIC_NOT_FOUND');
      }

      assert.deepEqual(nodes, []);
    });

    it('should return nodes returned from the lookup', async () => {
      const { errors, nodes } = await lookup([lookupAddress], { topic });

      assert.equal(errors.length, 0);
      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].broadcast_address, '127.0.0.1');
      assert.equal(nodes[0].tcp_port, 4150);
      assert.equal(nodes[0].http_port, 4151);
    });
  });
});
