import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  // 自訂 cookie 名稱避免跟本機其他 NextAuth 專案（例：記帳系統 localhost:3000）撞
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}celesverse.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}celesverse.callback-url`,
      options: { sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}celesverse.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}celesverse.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 900,
      },
    },
    state: {
      name: `${cookiePrefix}celesverse.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 900,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || account?.provider !== "google") return false;

      const admin = await prisma.admin.findUnique({
        where: { email: user.email },
      });

      if (admin) {
        if (!admin.isActive) {
          return "/admin/login?error=AccessDenied";
        }
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            googleSub: admin.googleSub ?? account.providerAccountId,
            lastLoginAt: new Date(),
            name: admin.name || user.name || admin.email,
          },
        });
        return true;
      }

      // 非管理員 → 以會員身份登入（自動建檔）
      const existingMember = await prisma.member.findUnique({
        where: { email: user.email },
      });

      if (existingMember) {
        if (!existingMember.isActive) return "/login?error=AccessDenied";
        await prisma.member.update({
          where: { id: existingMember.id },
          data: {
            googleSub: existingMember.googleSub ?? account.providerAccountId,
            lastLoginAt: new Date(),
          },
        });
      } else {
        await prisma.member.create({
          data: {
            email: user.email,
            name: user.name || user.email,
            googleSub: account.providerAccountId,
            lastLoginAt: new Date(),
          },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if ((trigger === "signIn" || trigger === "signUp") && user?.email) {
        const admin = await prisma.admin.findUnique({
          where: { email: user.email },
        });
        if (admin) {
          token.userId = admin.id;
          token.userType = "admin";
          token.role = admin.role;
          return token;
        }
        const member = await prisma.member.findUnique({
          where: { email: user.email },
        });
        if (member) {
          token.userId = member.id;
          token.userType = "member";
          token.role = undefined;
          return token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
        session.user.userType = token.userType as "admin" | "member";
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
});
