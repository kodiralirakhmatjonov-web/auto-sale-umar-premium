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
    return Response.redirect(loginUrl.toString(), 302);
  }

  return context.next();
}
