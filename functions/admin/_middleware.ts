import { getAuthenticatedUser, type Env } from "../_lib/auth";

function privateRedirect(url: URL, pathname: string): Response {
  const target = new URL(pathname, url.origin);
  const response = Response.redirect(target.toString(), 302);
  response.headers.set("cache-control", "no-store, private");
  return response;
}

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
  if (!user) return privateRedirect(url, "/admin/login/");

  const isManager = user.role === "sales_manager";
  const isAdminRoot = url.pathname === "/admin" || url.pathname === "/admin/";
  const isStaffArea = url.pathname === "/admin/staff" || url.pathname.startsWith("/admin/staff/");
  const isHomeArea = url.pathname === "/admin/home" || url.pathname.startsWith("/admin/home/");

  if (isAdminRoot) {
    return privateRedirect(url, isManager ? "/admin/cars/" : "/admin/staff/");
  }

  if (isManager && (isStaffArea || isHomeArea)) {
    return privateRedirect(url, "/admin/cars/");
  }

  const response = await context.next();
  response.headers.set("cache-control", "no-store, private");
  return response;
}
