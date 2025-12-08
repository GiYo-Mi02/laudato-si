import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    // Check if user email is from umak.edu.ph domain
    if (token?.email && !token.email.endsWith("@umak.edu.ph")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if authenticated with umak email
        if (token?.email && token.email.endsWith("@umak.edu.ph")) {
          return true;
        }
        return false;
      },
    },
  }
);

export const config = {
  matcher: ["/api/contributions/:path*"],
};
