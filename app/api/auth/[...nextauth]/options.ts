import { NextAuthOptions } from "next-auth";
import GoogleProvider from 'next-auth/providers/google'
import Spotify from "next-auth/providers/spotify";

export const AuthOptions :  NextAuthOptions = {
    providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/youtube'
                }
            }
  }),
  Spotify({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    authorization: {
                params: {
                    scope: 'user-read-email playlist-read-private playlist-modify-public playlist-modify-private'
                }
            }

  })
]

}