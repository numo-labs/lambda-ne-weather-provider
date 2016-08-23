'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

function read (bucket, key) {
  console.log(`Looking for ${key} in ${bucket}`);
  return Promise.resolve()
    .then(() => {
      return Promise.promisify(s3.getObject, { context: s3 })({
        Bucket: bucket,
        Key: key
      });
    })
    .then((result) => {
      return JSON.parse(result.Body.toString());
    })
    .catch(() => {
      /* ignore destinations that have no climate data in s3 */
    });
}

module.exports = read;
