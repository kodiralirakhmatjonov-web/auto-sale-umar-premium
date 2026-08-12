type AssetsBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type PagesMiddlewareContext = {
  request: Request;
  env: {
    ASSETS: AssetsBinding;
  };
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
};

const DISPLAY_HOST = "display.autosaleumar.com";
const DISPLAY_PATH = "/display/";

export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);

  // Keep the primary website, API routes, admin routes and static assets untouched.
  if (url.hostname.toLowerCase() !== DISPLAY_HOST || url.pathname !== "/") {
    return context.next();
  }

  // Internal rewrite: the browser stays on display.autosaleumar.com while
  // Cloudflare serves the already-built /display page from the same Pages project.
  const displayUrl = new URL(context.request.url);
  displayUrl.pathname = DISPLAY_PATH;

  const rewrittenRequest = new Request(displayUrl.toString(), context.request);
  return context.env.ASSETS.fetch(rewrittenRequest);
}
