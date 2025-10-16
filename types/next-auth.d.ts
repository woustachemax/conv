import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
    user: {
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    provider?: string
    email?: string
  }
}