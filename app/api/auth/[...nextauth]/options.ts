import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import client from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { Account } from "@prisma/client"; this ist a thing lmao

export const AuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
        },
      },
    }),
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "user-read-email playlist-read-private playlist-modify-public playlist-modify-private",
        },
      },
    }),
  ],
  adapter: PrismaAdapter(client),
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return true;

      const existingUser = await client.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (existingUser) {
        const accountExists = existingUser.accounts.some(
          (acc: any) =>
            acc.provider === account.provider &&
            acc.providerAccountId === account.providerAccountId
        );

        if (!accountExists) {
          await client.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        }
      }

      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
