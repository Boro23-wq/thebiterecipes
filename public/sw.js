const CACHE_NAME = "bite-v1";

// Install — cache shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch — network first, no aggressive caching for now
self.addEventListener("fetch", (event) => {
  // Let all requests pass through to network
  return;
});
