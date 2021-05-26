import EmberRouter from '@ember/routing/router';

import config from 'dummy/config/environment';
import { withHashSupport } from 'ember-url-hash-polyfill';

@withHashSupport
export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {});
