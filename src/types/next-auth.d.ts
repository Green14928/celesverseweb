import type { AdminRole } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

export type UserType = "admin" | "member";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType: UserType;
      role?: AdminRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    userType: UserType;
    role?: AdminRole;
  }
}
