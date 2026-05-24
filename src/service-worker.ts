/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Cache key including the deployment version
const CACHE_NAME = `whos-it-cache-v${version}`;

// Combine build artifacts (JS/CSS) and static files (icons, manifest)
const ASSETS_TO_CACHE = [
  ...build,
  ...files
];

self.addEventListener('install', (event: any) => {
  async function preCache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);
  }
  event.waitUntil(preCache());
});

self.addEventListener('activate', (event: any) => {
  async function clearOldCaches() {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
  }
  event.waitUntil(clearOldCaches());
});

self.addEventListener('fetch', (event: any) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  async function handleFetch() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE_NAME);

    // 1. For SvelteKit build artifacts & static files, serve strictly from cache first
    if (ASSETS_TO_CACHE.includes(url.pathname)) {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // 2. For other requests, attempt network first, falling back to cache or offline response
    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse.status === 200) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (err) {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Network offline and no cache available', { status: 408 });
    }
  }

  event.respondWith(handleFetch());
});
