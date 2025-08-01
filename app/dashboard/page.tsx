"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Logout from "../components/Logout"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return 

    if (status === "unauthenticated") {
      router.push("/") 
      return
    }

    if (status === "authenticated") {
      fetchPlaylists()
    }
  }, [status, router])

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/spotify")
      if (!res.ok) {
        const err = await res.json()
        setError(err.error?.message || "Failed to load playlists")
        return
      }
      const data = await res.json()
      setPlaylists(data.playlists)
    } catch (err) {
      setError("Unexpected error occurred")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-900 to-pink-900 p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-zinc-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <Logout />
        </div>

        <div className="bg-pink-900 rounded-lg p-6">
          <h2 className="text-xl text-white mb-4">Your Playlists</h2>
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-200">{error}</p>
              {error.includes("Spotify") && (
                <p className="text-red-200 text-sm mt-2">
                  Please make sure you've connected your Spotify account.
                </p>
              )}
            </div>
          )}
          <ul className="space-y-2">
            {playlists.map((playlist) => (
              <li
                key={playlist.id}
                className="bg-zinc-800 rounded p-4 text-white hover:bg-zinc-700 transition"
              >
                <div className="flex items-center space-x-4">
                  {playlist.image && (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div>
                    <a
                      href={playlist.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold hover:underline"
                    >
                      {playlist.name}
                    </a>
                    <p className="text-sm text-gray-400">
                      {playlist.tracks} tracks
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}