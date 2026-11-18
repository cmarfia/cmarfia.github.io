const CACHE_PREFIX = "robot-spelling-lab-";
const CACHE_VERSION = "v1";
const APP_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const VOCABULARY_URL = new URL("./vocabulary.json", self.location.href).href;

const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./vocabulary.json",
  "./namespace.js",
  "./vocabulary.js",
  "./game-registry.js",
  "./game-engine.js",
  "./navigation.js",
  "./app.js",
  "./service-worker-registration.js",
  "./core/game-feedback.js",
  "./utils/array-utils.js",
  "./utils/string-utils.js",
  "./utils/dom-utils.js",
  "./games/word-detective.js",
  "./games/word-typing.js",
  "./games/missing-letters.js",
  "./games/word-scramble.js",
  "./games/definition-match.js",
  "./robots/robot-dialogue.js",
  "./robots/robot-factory.js",
  "./robots/robot-controller.js",
  "./styles/main.css",
  "./styles/navigation.css",
  "./styles/robots.css",
  "./styles/games.css",
  "./icons/robot-spelling-lab-192.png",
  "./icons/robot-spelling-lab-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(cacheApplicationShell());
});

self.addEventListener("activate", event => {
  event.waitUntil(removeOldCaches());
});

self.addEventListener("fetch", event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
  if (requestUrl.search || requestUrl.hash) return;

  if (requestUrl.href === VOCABULARY_URL) {
    event.respondWith(networkFirstVocabulary(event.request));
  } else if (isAppAsset(requestUrl)) {
    event.respondWith(cacheFirstAsset(event.request));
  }
});

async function cacheApplicationShell() {
  const cache = await caches.open(APP_CACHE);
  await cache.addAll(APP_ASSETS);
}

async function removeOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys
    .filter(key => key.startsWith(CACHE_PREFIX) && key !== APP_CACHE)
    .map(key => caches.delete(key)));
  await self.clients.claim();
}

async function networkFirstVocabulary(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

function isAppAsset(url) {
  const appRoot = new URL("./", self.location.href).pathname;
  return url.pathname.startsWith(appRoot) &&
    APP_ASSETS.some(asset => new URL(asset, self.location.href).pathname === url.pathname);
}
