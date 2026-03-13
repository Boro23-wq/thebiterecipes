import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth", // hidden admin entry point
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // /auth → redirect to sign-in (or dashboard if already logged in)
  if (pathname === "/auth") {
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Prevent logged-in users from visiting auth pages
  if (
    userId &&
    (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (userId) {
    try {
      const profile = await db.query.onboardingProfiles.findFirst({
        where: eq(onboardingProfiles.userId, userId),
        columns: { onboardingCompleted: true },
      });

      const onboardingCompleted = profile?.onboardingCompleted;

      if (!onboardingCompleted && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      if (onboardingCompleted && pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Fail open
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
