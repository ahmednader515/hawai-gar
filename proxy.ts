import { auth } from "@/auth-edge";

const roleRoutes: Record<string, string> = {
  COMPANY: "/dashboard/company",
  DRIVER: "/dashboard/driver",
  ADMIN: "/dashboard/admin",
  SUPERVISOR: "/dashboard/supervisor",
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const path = nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const login = new URL("/login", nextUrl.origin);
      login.searchParams.set("callbackUrl", path);
      return Response.redirect(login);
    }
    const role = req.auth?.user?.role as keyof typeof roleRoutes | undefined;
    const base = role ? roleRoutes[role] : null;
    if (base && path.startsWith("/dashboard") && !path.startsWith(base)) {
      return Response.redirect(new URL(base, nextUrl.origin));
    }
  }

  if (path.startsWith("/login") || path.startsWith("/register")) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role as keyof typeof roleRoutes | undefined;
      const dest = role ? roleRoutes[role] : "/dashboard";
      return Response.redirect(new URL(dest, nextUrl.origin));
    }
  }

  return undefined;
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/onboarding/:path*"],
};
