'use client'
import { signIn } from "next-auth/react"

export default function LoginButtons() {
  return (
    <>
      <button
        onClick={() => signIn('spotify')}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-green-600 bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        Continue with Spotify
      </button>
      
      <button
        onClick={() => signIn('google')}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-800 bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
      >
        Continue with Google
      </button>
    </>
  )
}