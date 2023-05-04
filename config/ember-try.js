'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function () {
  return {
    /**
     * Related to https://github.com/emberjs/ember.js/issues/20418
     * This prevent npm to break ember-canary & ember-beta :
     * ember-resolver@10.0.0 have an optional peerDependency to ember-source ^4.8.3 & it make npm break (where yarn does not).
     * Adding this option will prevent npm to complain about this
     */
    npmOptions: ['--legacy-peer-deps'],

    scenarios: [
      {
        name: 'ember-4.4',
        npm: {
          devDependencies: {
            'ember-source': '~4.4.0',
          },
        },
      },
      {
        name: 'ember-4.8',
        npm: {
          devDependencies: {
            'ember-source': '~4.8.0',
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
            // https://github.com/emberjs/ember.js/issues/20418
            'ember-resolver': '10.0.0',
            '@ember/string': '3.0.1',
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
            // https://github.com/emberjs/ember.js/issues/20418
            'ember-resolver': '10.0.0',
            '@ember/string': '3.0.1',
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
