'use client'
import { signOut } from "next-auth/react"

export default function Logout() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    })
  }

  return (
    <button 
      onClick={handleSignOut}
      className="px-4 py-2 font-bold border border-transparent rounded-lg bg-white text-red-600 hover:bg-gray-200"
    >
      Sign Out
    </button>
  )
}