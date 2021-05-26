import { getOwner } from '@ember/application';
import { warn } from '@ember/debug';
import { isDestroyed, isDestroying, registerDestructor } from '@ember/destroyable';
import { schedule } from '@ember/runloop';
import { waitForPromise } from '@ember/test-waiters';

import type ApplicationInstance from '@ember/application/instance';
import type { Route } from '@ember/routing';
import type EmberRouter from '@ember/routing/router';
import type RouterService from '@ember/routing/router-service';

type Transition = Parameters<Route['beforeModel']>[0];
type TransitionWithPrivateAPIs = Transition & {
  intent?: {
    url: string;
  };
};

export function withHashSupport(AppRouter: typeof EmberRouter): typeof AppRouter {
  return class RouterWithHashSupport extends AppRouter {
    constructor(...args: RouterArgs) {
      super(...args);

      setupHashSupport(this);
    }
  };
}

export function scrollToHash(hash: string) {
  let selector = `[name="${hash}"]`;
  let element = document.getElementById(hash) || document.querySelector(selector);

  if (!element) {
    warn(`Tried to scroll to element with id or name "${hash}", but it was not found`, {
      id: 'no-hash-target',
    });

    return;
  }

  /**
   * NOTE: the ember router does not support hashes in the URL
   *       https://github.com/emberjs/rfcs/issues/709
   *
   *       this means that when testing hash changes in the URL,
   *       we have to assert against the window.location, rather than
   *       the self-container currentURL helper
   *
   * NOTE: other ways of changing the URL, but without the smoothness:
   *   - window[.top].location.replace
   */

  element.scrollIntoView({ behavior: 'smooth' });

  if (hash !== window.location.hash) {
    let withoutHash = location.href.split('#')[0];
    let nextUrl = `${withoutHash}#${hash}`;
    // most browsers ignore the title param of pushState
    let titleWithoutHash = document.title.split(' | #')[0];
    let nextTitle = `${titleWithoutHash} | #${hash}`;

    history.pushState({}, nextTitle, nextUrl);
    document.title = nextTitle;
  }
}

async function setupHashSupport(router: EmberRouter) {
  let initialURL: string | undefined;
  let owner = getOwner(router) as ApplicationInstance;

  await new Promise((resolve) => {
    let interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { currentURL } = router as any; /* Private API */

      if (currentURL) {
        clearInterval(interval);
        initialURL = currentURL;
        resolve(null);
      }
    }, 100);
  });

  if (isDestroyed(owner) || isDestroying(owner)) {
    return;
  }

  /**
   * This handles the initial Page Load, which is not imperceptible through
   * route{Did,Will}Change
   *
   */
  requestAnimationFrame(() => {
    eventuallyTryScrollingTo(owner, initialURL);
  });

  let routerService = owner.lookup('service:router') as RouterService;

  function handleHashIntent(transition: TransitionWithPrivateAPIs) {
    let { url } = transition.intent || {};

    if (!url) {
      return;
    }

    eventuallyTryScrollingTo(owner, url);
  }

  routerService.on('routeDidChange', handleHashIntent);

  registerDestructor(router, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (routerService as any) /* type def missing "off" */
      .off('routeDidChange', handleHashIntent);
  });
}

const CACHE = new WeakMap<ApplicationInstance, MutationObserver>();

async function eventuallyTryScrollingTo(owner: ApplicationInstance, url?: string) {
  // Prevent quick / rapid transitions from continuing to observer beyond their URL-scope
  CACHE.get(owner)?.disconnect();

  if (!url) return;

  let [, hash] = url.split('#');

  if (!hash) return;

  await waitForPromise(uiSettled(owner));

  if (isDestroyed(owner) || isDestroying(owner)) {
    return;
  }

  scrollToHash(hash);
}

const TIME_SINCE_LAST_MUTATION = 500; // ms
const MAX_TIMEOUT = 2000; // ms

// exported for testing
export async function uiSettled(owner: ApplicationInstance) {
  let timeStarted = new Date().getTime();
  let lastMutationAt = Infinity;
  let totalTimeWaited = 0;

  let observer = new MutationObserver(() => {
    lastMutationAt = new Date().getTime();
  });

  CACHE.set(owner, observer);

  observer.observe(document.body, { childList: true, subtree: true });

  /**
   * Wait for DOM mutations to stop until MAX_TIMEOUT
   */
  await new Promise((resolve) => {
    let frame: number;

    function requestTimeCheck() {
      if (frame) cancelAnimationFrame(frame);

      if (isDestroyed(owner) || isDestroying(owner)) {
        return;
      }

      frame = requestAnimationFrame(() => {
        totalTimeWaited = new Date().getTime() - timeStarted;

        let timeSinceLastMutation = new Date().getTime() - lastMutationAt;

        if (totalTimeWaited >= MAX_TIMEOUT) {
          return resolve(totalTimeWaited);
        }

        if (timeSinceLastMutation >= TIME_SINCE_LAST_MUTATION) {
          return resolve(totalTimeWaited);
        }

        schedule('afterRender', requestTimeCheck);
      });
    }

    schedule('afterRender', requestTimeCheck);
  });
}
