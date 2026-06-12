import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

// Ativa imediatamente, sem esperar o SW antigo ser descartado.
self.addEventListener("install", () => (self as any).skipWaiting());

// Quando ativa: assume controlo de todos os clientes e força o reload de cada
// janela aberta. Funciona mesmo para clientes com código antigo (não depende
// de nenhum listener JS no lado do cliente).
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (self as any).clients.claim().then(() =>
      (self as any).clients
        .matchAll({ type: "window" })
        .then((clients: any[]) =>
          Promise.all(clients.map((c: any) => c.navigate(c.url)))
        )
    )
  );
});

precacheAndRoute((self as any).__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA fallback: qualquer navegação serve o index.html do cache.
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));
