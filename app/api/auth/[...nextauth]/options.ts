import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import client from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

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
      console.log("SignIn callback:", { 
        userEmail: user.email, 
        provider: account?.provider,
        accountId: account?.providerAccountId 
      });

      if (!user.email || !account) {
        console.log("Missing email or account");
        return true;
      }

      try {
        const existingUser = await client.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          console.log("Existing user found, checking accounts...");
          
          const accountExists = existingUser.accounts.some(
            (acc) =>
              acc.provider === account.provider &&
              acc.providerAccountId === account.providerAccountId
          );

          if (!accountExists) {
            console.log("Linking new account to existing user...");
            
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
            
            console.log(`Successfully linked ${account.provider} account`);
          } else {
            console.log("Account already exists, updating tokens...");
            
            await client.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              data: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
            
            console.log(`Updated ${account.provider} account tokens`);
          }
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; 
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};