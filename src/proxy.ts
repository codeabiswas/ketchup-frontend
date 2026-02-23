import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname === "/") {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
