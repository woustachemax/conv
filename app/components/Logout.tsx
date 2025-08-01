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
      className="relative py-3 px-6 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-100"
    >
      Sign Out
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/10 via-transparent to-red-600/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </button>
  )
}