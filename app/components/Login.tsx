'use client'
import { signIn } from "next-auth/react"

export default function LoginButtons() {
  return (
    <>
      <button
        onClick={() => signIn('spotify')}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        Continue with Spotify
      </button>
      
      <button
        onClick={() => signIn('google')}
        className="w-full flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
      >
        Continue with Google
      </button>
    </>
  )
}