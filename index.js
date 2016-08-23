'use strict';
require('env2')('.env');

const Promise = require('bluebird');
const sauce = require('mintsauce');
const lambda = sauce();

const lookup = require('./lib/lookup-climate');

// setup sns helpers
lambda.use(sauce.middleware.SNS);

// create a response method to send results to client
lambda.use((call, response, next) => {
  const params = {
    id: call.body.context.connectionId,
    searchId: call.body.context.searchId,
    userId: 1,
    provider: call.name
  };
  response.emitResultEvent = (data, callback) => {
    const topic = `${process.env.SEARCH_RESULT_TOPIC}-${call.version}`;
    const payload = Object.assign(data, params);
    response.sns.send(topic, payload, callback);
  };
  next();
});

// get the destination tiles from the inbound message
lambda.use((call, response, next) => {
  call.body.destinations = call.body.content.tiles.filter((tile) => {
    return tile.match(/^tile:destination\./);
  });
  next();
});

// iterate over the destination tiles, perform a weather lookup
// for each and send the results to the client
lambda.use((call, response, next) => {
  return Promise.map(call.body.destinations, (destination) => {
    return lookup(destination)
      .then((data) => {
        if (!data) return;
        // send the result to the client
        return Promise.promisify(response.emitResultEvent)({ items: [ data ] }).then(() => data);
      });
  }, { concurrency: 3 })
  .then((results) => {
    response.data = results.filter(o => o);
  });
});

// emit a complate event to the client
lambda.use((call, response, next) => {
  response.emitResultEvent({ searchComplete: true }, (e) => next(e));
});

// send callback
lambda.use((call, response) => {
  response.send(response.data);
});

module.exports = {
  handler: lambda
};
