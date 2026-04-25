import { type NextAuthConfig } from "next-auth";

import { buildSessionFromToken, syncTokenWithUser } from "./shared";

export const middlewareAuthConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => syncTokenWithUser(token, user),
    session: ({ session, token }) => buildSessionFromToken(session, token),
  },
} satisfies NextAuthConfig;
