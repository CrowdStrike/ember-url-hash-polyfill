import Controller from '@ember/controller';
import { assert as debugAssert } from '@ember/debug';
import { click, find, settled, visit } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import { scrollToHash, uiSettled } from 'ember-url-hash-polyfill';

import { setupRouter } from './-helpers';

module('Hash', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(() => {
    location.hash = '';
  });
  hooks.afterEach(() => {
    location.hash = '';
  });

  // TODO: PR this to qunit-dom as assort.dom(element).isInView();
  //       assert.dom().isVisible does not check if the element is within the viewport
  function isVisible(element: null | Element, parent: Element) {
    if (!element) return false;

    let bounds = element.getBoundingClientRect();
    let parentBounds = parent.getBoundingClientRect();

    return (
      bounds.top >= parentBounds.top &&
      bounds.left >= parentBounds.left &&
      bounds.right <= parentBounds.right &&
      bounds.bottom <= parentBounds.bottom
    );
  }

  module('linking with hashes', function (_hooks) {
    test('in-page-links can be scrolled to with native anchors', async function (assert) {
      this.owner.register(
        'template:application',
        hbs`
          <a id='first-link' href="#first">first</a>
          <a id='second-link' href="#second">first</a>

          <h1 id="first">first!</h1>
          <div style="height: 100vh;"></div>

          <h1 id="second">second!</h1>
          <div style="height: 100vh;"></div>
        `
      );

      await visit('/');

      let container = document.querySelector('#ember-testing-container');
      let first = find('#first');
      let second = find('#second');

      debugAssert(`Expected all test elements to exist`, container && first && second);

      assert.true(isVisible(first, container), 'first header is visible');
      assert.false(isVisible(second, container), 'second header is not visible');
      assert.equal(location.hash, '', 'initially, has no hash');

      await click('#second-link');

      assert.false(isVisible(first, container), 'first header is not visible');
      assert.true(isVisible(second, container), 'second header is visible');
      assert.equal(location.hash, '#second', 'clicked hash appears in URL');

      await click('#first-link');

      assert.true(isVisible(first, container), 'first header is visible');
      assert.false(isVisible(second, container), 'second header is not visible');
      assert.equal(location.hash, '#first', 'clicked hash appears in URL');
    });

    test('in-page-links can be scrolled to with custom links', async function (assert) {
      class TestApplication extends Controller {
        handleClick = (event: MouseEvent) => {
          event.preventDefault();

          debugAssert(
            `Expected event to be from an anchor tag`,
            event.target instanceof HTMLAnchorElement
          );

          let [, hash] = event.target.href.split('#');

          scrollToHash(hash);
        };
      }
      this.owner.register('controller:application', TestApplication);

      this.owner.register(
        'template:application',
        hbs`
          <a id='first-link' href="#first" {{on 'click' this.handleClick}}>first</a>
          <a id='second-link' href="#second" {{on 'click' this.handleClick}}>first</a>

          <h1 id="first">first!</h1>
          <div style="height: 100vh;"></div>

          <h1 id="second">second!</h1>
          <div style="height: 100vh;"></div>
        `
      );

      await visit('/');

      let container = document.querySelector('#ember-testing-container');
      let first = find('#first');
      let second = find('#second');

      debugAssert(`Expected all test elements to exist`, container && first && second);

      assert.true(isVisible(first, container), 'first header is visible');
      assert.false(isVisible(second, container), 'second header is not visible');
      assert.equal(location.hash, '', 'initially, has no hash');

      await click('#second-link');
      await scrollSettled();

      assert.false(isVisible(first, container), 'first header is not visible');
      assert.true(isVisible(second, container), 'second header is visible');
      assert.equal(location.hash, '#second', 'clicked hash appears in URL');

      await click('#first-link');
      await scrollSettled();

      assert.true(isVisible(first, container), 'first header is visible');
      assert.false(isVisible(second, container), 'second header is not visible');
      assert.equal(location.hash, '#first', 'clicked hash appears in URL');
    });
  });

  module('with transitions', function (hooks) {
    setupRouter(hooks, {
      map: function () {
        this.route('foo');
        this.route('bar');
      },
    });

    test('cross-page-Llinks are properly scrolled to', async function (assert) {
      this.owner.register(
        'template:foo',
        hbs`
          <h1 id="foo-first">first!</h1>
          <div style="height: 100vh;"></div>

          <h1 id="foo-second">second!</h1>
          <div style="height: 100vh;"></div>
        `
      );

      this.owner.register(
        'template:bar',
        hbs`
          <h1 id="bar-first">first!</h1>
          <div style="height: 100vh;"></div>

          <h1 id="bar-second">second!</h1>
          <div style="height: 100vh;"></div>
        `
      );

      let router = this.owner.lookup('service:router');
      let container = document.querySelector('#ember-testing-container');

      debugAssert(`Expected all test elements to exist`, container);

      router.transitionTo('/foo');
      await uiSettled(this.owner);

      assert.true(isVisible(find('#foo-first'), container), 'first header is visible');
      assert.false(isVisible(find('#foo-second'), container), 'second header is not visible');
      assert.equal(location.hash, '', 'initially, has no hash');

      router.transitionTo('/bar#bar-second');
      await uiSettled(this.owner);
      await scrollSettled();

      assert.false(isVisible(find('#bar-first'), container), 'first header is not visible');
      assert.true(isVisible(find('#bar-second'), container), 'second header is visible');
      assert.equal(location.hash, '#bar-second', 'clicked hash appears in URL');

      router.transitionTo('/foo#foo-second');
      await uiSettled(this.owner);
      await scrollSettled();

      assert.false(isVisible(find('#foo-first'), container), 'first header is not visible');
      assert.true(isVisible(find('#foo-second'), container), 'second header is visible');
      assert.equal(location.hash, '#foo-second', 'clicked hash appears in URL');
    });
  });
});

export async function scrollSettled() {
  // wait for previous stuff to finish
  await settled();

  let timeout = 200; // ms;
  let start = new Date().getTime();

  await Promise.race([
    new Promise((resolve) => setTimeout(resolve, 1000)),
    // scrollIntoView does not trigger scroll events
    new Promise((resolve) => {
      let interval = setInterval(() => {
        let now = new Date().getTime();

        if (now - start >= timeout) {
          clearInterval(interval);

          return resolve(now);
        }
      }, 10);
    }),
  ]);

  await settled();
}
