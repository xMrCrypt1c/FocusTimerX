/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d97271ec8650cdba20a98b994d2e57f9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2d630040aba98159a03f6831d3056440"
  }, {
    "url": "pwa-192x192.png",
    "revision": "dde0d5c8708785911436e80971f03580"
  }, {
    "url": "index.html",
    "revision": "2cb18885a0aa105c5881dcce68e3737e"
  }, {
    "url": "icon.svg",
    "revision": "45cb92e31e8feaa10e2f4a290535455d"
  }, {
    "url": "favicon.ico",
    "revision": "6e9e621aabf9fcc02249b7a6bd251bba"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d5e0ce24c22bc86b81900aa8a0fb8c36"
  }, {
    "url": "assets/index-C18TZErr.js",
    "revision": null
  }, {
    "url": "assets/index-BUR24AXb.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d5e0ce24c22bc86b81900aa8a0fb8c36"
  }, {
    "url": "favicon.ico",
    "revision": "6e9e621aabf9fcc02249b7a6bd251bba"
  }, {
    "url": "icon.svg",
    "revision": "45cb92e31e8feaa10e2f4a290535455d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "dde0d5c8708785911436e80971f03580"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2d630040aba98159a03f6831d3056440"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d97271ec8650cdba20a98b994d2e57f9"
  }, {
    "url": "manifest.webmanifest",
    "revision": "497f433a3b44642882a9cfb7ee015710"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
