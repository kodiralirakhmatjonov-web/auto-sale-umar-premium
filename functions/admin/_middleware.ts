import { getAuthenticatedUser, type Env } from "../_lib/auth";

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);

  if (url.pathname === "/admin/login" || url.pathname === "/admin/login/") {
    return context.next();
  }

  const user = await getAuthenticatedUser(context.request, context.env);
  if (!user) {
    const loginUrl = new URL("/admin/login/", url.origin);
    const response = Response.redirect(loginUrl.toString(), 302);
    response.headers.set("cache-control", "no-store, private");
    return response;
  }

  const response = await context.next();
  response.headers.set("cache-control", "no-store, private");
  return response;
}
