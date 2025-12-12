/**
 * ============================================================================
 * NEXTAUTH API ROUTE
 * ============================================================================
 * Handles authentication requests via NextAuth.js.
 * Configuration is imported from @/lib/auth to avoid export constraints.
 * ============================================================================
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
