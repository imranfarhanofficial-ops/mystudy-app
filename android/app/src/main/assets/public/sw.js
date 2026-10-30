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
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "3f55a947d46a0218797754cea7775980"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3f55a947d46a0218797754cea7775980"
  }, {
    "url": "pwa-192x192.png",
    "revision": "56c1605204244fabd8d6bba4cc754f44"
  }, {
    "url": "index.html",
    "revision": "37c16698f10107c08d1a71d245200430"
  }, {
    "url": "icon.svg",
    "revision": "c6bbb186231bfdcd37aa0f04b6fe5bc1"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0c3433831857ae88cf4bfb751569d1ea"
  }, {
    "url": "assets/index-CVbumU8N.css",
    "revision": null
  }, {
    "url": "assets/index-C9UQAY4O.js",
    "revision": null
  }, {
    "url": "assets/aistudio/file_0000000032248208b99106cb62c3dc37_6d312a13.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0c3433831857ae88cf4bfb751569d1ea"
  }, {
    "url": "icon.svg",
    "revision": "c6bbb186231bfdcd37aa0f04b6fe5bc1"
  }, {
    "url": "pwa-192x192.png",
    "revision": "56c1605204244fabd8d6bba4cc754f44"
  }, {
    "url": "pwa-512x512.png",
    "revision": "3f55a947d46a0218797754cea7775980"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "3f55a947d46a0218797754cea7775980"
  }, {
    "url": "manifest.webmanifest",
    "revision": "0f07e68c423b3ddd1decd33e5c9e4696"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
