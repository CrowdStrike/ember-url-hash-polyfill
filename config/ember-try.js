'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function () {
  return {
    scenarios: [
      {
        name: 'ember-3.25',
        npm: {
          devDependencies: {
            'ember-source': '~3.25.0',
          },
        },
      },
      {
        name: 'ember-3.26',
        npm: {
          devDependencies: {
            'ember-source': '~3.26.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      {
        name: 'embroider',
        npm: {
          devDependencies: {
            '@embroider/core': '*',
            '@embroider/webpack': '*',
            '@embroider/compat': '*',
          },
        },
      },
    ],
  };
};
