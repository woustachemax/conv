'use client'
import { signOut } from "next-auth/react"

export default function Logout() {
  return (
    <button 
      onClick={() => signOut()}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Sign Out
    </button>
  )
}