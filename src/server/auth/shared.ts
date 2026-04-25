import { type DefaultSession, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

type AuthUserLike = Pick<User, "id"> & {
  role?: unknown;
};

export function syncTokenWithUser(token: JWT, user?: AuthUserLike) {
  if (!user) {
    return token;
  }

  if (user.id) {
    token.id = user.id;
  }

  if (typeof user.role === "string") {
    token.role = user.role;
  }

  return token;
}

export function buildSessionFromToken(session: Session, token: JWT): Session {
  return {
    ...session,
    user: {
      ...session.user,
      id: token.id ?? "",
      role: token.role ?? "user",
    },
  };
}
