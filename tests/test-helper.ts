import { currentURL, getSettledState, setApplication } from '@ember/test-helpers';
import { getPendingWaiterState } from '@ember/test-waiters';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

import Application from 'dummy/app';
import config from 'dummy/config/environment';

// easy access debugging tools during a paused or stuck test
Object.assign(window, { getSettledState, currentURL, getPendingWaiterState });

setApplication(Application.create(config.APP));

setup(QUnit.assert);

start();
