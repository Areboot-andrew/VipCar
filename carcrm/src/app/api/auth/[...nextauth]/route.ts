import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const authSettingKeys = [
  "google_auth_enabled",
  "google_client_id",
  "google_client_secret",
  "facebook_auth_enabled",
  "facebook_client_id",
  "facebook_client_secret",
];

async function getAuthSettings() {
  const rows = await prisma.siteContent.findMany({
    where: { key: { in: authSettingKeys } },
  });

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function buildAuthOptions(): Promise<NextAuthOptions> {
  const settings = await getAuthSettings();
  const providers: NextAuthOptions["providers"] = [];

  if (settings.google_auth_enabled === "true" && settings.google_client_id && settings.google_client_secret) {
    providers.push(
      GoogleProvider({
        clientId: settings.google_client_id,
        clientSecret: settings.google_client_secret,
      })
    );
  }

  if (settings.facebook_auth_enabled === "true" && settings.facebook_client_id && settings.facebook_client_secret) {
    providers.push(
      FacebookProvider({
        clientId: settings.facebook_client_id,
        clientSecret: settings.facebook_client_secret,
      })
    );
  }

  return {
    ...authOptions,
    providers: [...providers, ...authOptions.providers],
  };
}

async function handler(req: Request, context: any) {
  const options = await buildAuthOptions();
  return NextAuth(options)(req as any, context);
}

export { handler as GET, handler as POST };
