import { NextResponse, type NextRequest } from "next/server";

// Garde légère : la validation réelle de la session se fait côté serveur (getCurrentUser).
const PROTECTED = ["/dashboard", "/messages", "/onboarding", "/upgrade", "/checkout", "/admin"];
const SESSION_COOKIE = "sefikh_session";
const VISITOR_COOKIE = "sefikh_vid";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protection CSRF des routes API mutantes (les Server Actions vérifient déjà l'origine).
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method) && pathname !== "/api/stripe/webhook") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!origin || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // Identifiant visiteur anonyme (quotas de recherche, statistiques) — sans donnée personnelle.
  if (!request.cookies.has(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|files/|images/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
