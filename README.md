ember-url-hash-polyfill
==============================================================================

Navigating to URLs with `#hash-targets` in them is not supported by
most single-page-app frameworks due to the async rendering nature of
modern web apps -- the browser can't scroll to a `#hash-target` on
page load / transition because the element hasn't rendered yet.
There is an issue about this for Ember
[here on the RFCs repo](https://github.com/emberjs/rfcs/issues/709).

This addon provides a way to support the behavior that is in normally
native to browsers where an anchor tag with `href="#some-id-or-name"`
would scroll down the page when clicked.

## Installation

```
yarn add ember-url-hash-polyfill
# or
npm install ember-url-hash-polyfill
# or
ember install ember-url-hash-polyfill
```

## Compatibility

* Ember.js v3.25 or above
* Node.js v14 or above

## Usage

To handle `/some-url/#hash-targets` on page load and after normal route transitions,
```diff
  // app/router.js

  import { withHashSupport } from 'ember-url-hash-polyfill';

+ @withHashSupport
  export default class Router extends EmberRouter {
    location = config.locationType;
    rootURL = config.rootURL;
  }
```

Additionally, there is a `scrollToHash` helper if manual invocation is desired.

```js
import { scrollToHash } from 'ember-url-hash-polyfill';

// ...

scrollToHash('some-element-id-or-name');
```


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
