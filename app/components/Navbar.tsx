'use client'
import React from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export const Navbar = () => {
  return (
    <div className="flex items-center justify-between py-6 px-4 w-full">
      <Link href="/">
        <img
          src="/logo.svg"
          alt="Logo"
          className="w-48 h-auto md:w-48 sm:w-36"
          loading="lazy"
          draggable="false"
        />
      </Link>

      <div className="flex gap-2 md:gap-4">
        <button
          onClick={() => signIn('spotify')}
          className="relative py-2 px-3 md:py-3 md:px-6 rounded-full text-white font-medium text-sm md:text-base bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-green-500/20 hover:border-green-400/30 hover:text-green-100"
        >
          <span className="hidden sm:inline">Continue with Spotify</span>
          <span className="sm:hidden">Spotify</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/10 via-transparent to-green-600/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </button>
        <button
          onClick={() => signIn('google')}
          className="relative py-2 px-3 md:py-3 md:px-6 rounded-full text-white font-medium text-sm md:text-base bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-100"
        >
          <span className="hidden sm:inline">Continue with Google</span>
          <span className="sm:hidden">Google</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/10 via-transparent to-red-600/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </button>
      </div>
    </div>
  )
}