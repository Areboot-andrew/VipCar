import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// API paths that must stay public (external callbacks and client-side actions)
const PUBLIC_API = [
  "/api/auth",                    // NextAuth
  "/api/webhooks",                // Telegram/Meta callbacks (verify their own secrets)
  "/api/quote",                   // price preview in the booking modal
  "/api/promotions/resolve-code", // promo-code check in the calculator
  "/api/cars/availability",       // availability check in the calculator
];

// Admin-only API namespaces — every method. These expose client data,
// finances or integration secrets (e.g. /api/settings and /api/cms return tokens).
const ADMIN_API = [
  "/api/settings",
  "/api/users",
  "/api/seed",
  "/api/admin",
  "/api/invoices",
  "/api/cms",
  "/api/page-blocks",
  "/api/drivers",
  "/api/telegram",
];

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function apiDenied(hasToken: boolean) {
  return NextResponse.json(
    { error: hasToken ? "Forbidden" : "Unauthorized" },
    { status: hasToken ? 403 : 401 }
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const method = req.method;
    const isAdmin = token?.role === "ADMIN";

    if (path.startsWith("/api/")) {
      if (startsWithAny(path, PUBLIC_API)) return NextResponse.next();

      // Admin chat center is exact /api/chat; per-booking chat (/api/chat/:id) checks its own session
      if (path === "/api/chat" && !isAdmin) return apiDenied(Boolean(token));

      if (startsWithAny(path, ADMIN_API) && !isAdmin) return apiDenied(Boolean(token));

      // Uploads: any logged-in user (clients attach photos in the chat)
      if (path === "/api/upload" && !token) return apiDenied(false);

      // Bookings: creating one is public, everything else is admin
      if (path === "/api/bookings" && method !== "POST" && !isAdmin) return apiDenied(Boolean(token));
      if (path.startsWith("/api/bookings/") && !isAdmin) return apiDenied(Boolean(token));

      // Feedback: submitting the form is public, reading the list is admin
      if (path === "/api/feedback" && method !== "POST" && !isAdmin) return apiDenied(Boolean(token));

      // Cars & promotions: reading is public (site), changing is admin.
      // Exception: client reviews POST validates its own eligibility.
      if (startsWithAny(path, ["/api/cars", "/api/promotions"]) && method !== "GET" && !isAdmin) {
        if (!path.endsWith("/reviews")) return apiDenied(Boolean(token));
      }

      return NextResponse.next();
    }

    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/driver") && token?.role !== "DRIVER" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // API access is decided in the middleware body (JSON 401/403 instead of redirects)
        if (req.nextUrl.pathname.startsWith("/api/")) return true;
        if (
          req.nextUrl.pathname.startsWith("/admin") ||
          req.nextUrl.pathname.startsWith("/driver") ||
          req.nextUrl.pathname.startsWith("/profile")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/driver/:path*", "/profile/:path*", "/api/:path*"],
};
