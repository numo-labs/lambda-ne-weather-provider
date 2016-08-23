'use strict';

const Promise = require('bluebird');

const read = require('./read-s3');

function lookup (id) {
  const key = id.replace(':destination', ':climate');
  const bucket = process.env.CLIMATE_DATA_BUCKET || 'numo-climate-data';
  return Promise.resolve()
    .then(() => {
      return read(bucket, `${key}.json`);
    })
    .then((climate) => {
      if (!climate) return;
      console.log('Found climate data:', climate);
      return {
        id: key,
        type: 'weather',
        tile: climate
      };
    });
}

module.exports = lookup;
