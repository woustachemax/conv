"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Logout from "../components/Logout"

interface Playlist {
  id: string;
  name: string;
  tracks: number;
  image: string | null;
  external_url: string;
  source: 'spotify' | 'youtube';
  description?: string;
  created_at?: string;
  privacy?: string;
}

interface PlatformStatus {
  loading: boolean;
  error: string | null;
  connected: boolean;
}

interface SpotifyPlaylistResponse {
  playlists: {
    id: string;
    name: string;
    tracks: number;
    image: string | null;
    external_url: string;
    description?: string;
    created_at?: string;
    privacy?: string;
  }[];
}

interface YouTubePlaylistResponse {
  playlists: {
    id: string;
    name: string;
    tracks: number;
    image: string | null;
    external_url: string;
    description?: string;
    created_at?: string;
    privacy?: string;
  }[];
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [spotify, setSpotify] = useState<PlatformStatus>({ loading: false, error: null, connected: false })
  const [youtube, setYoutube] = useState<PlatformStatus>({ loading: false, error: null, connected: false })

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (status === "authenticated") {
      fetchAllPlaylists()
    }
  }, [status, router])

  const fetchAllPlaylists = async () => {
    setPlaylists([])
    setSpotify({ loading: true, error: null, connected: false })
    setYoutube({ loading: true, error: null, connected: false })

    const [spotifyResult, youtubeResult] = await Promise.allSettled([
      fetchSpotifyPlaylists(),
      fetchYoutubePlaylists()
    ])

    const allPlaylists: Playlist[] = []
    
    if (spotifyResult.status === 'fulfilled') {
      allPlaylists.push(...spotifyResult.value)
    }
    
    if (youtubeResult.status === 'fulfilled') {
      allPlaylists.push(...youtubeResult.value)
    }

    allPlaylists.sort((a, b) => a.name.localeCompare(b.name))
    setPlaylists(allPlaylists)
  }

  const fetchSpotifyPlaylists = async (): Promise<Playlist[]> => {
    try {
      const res = await fetch("/api/spotify")
      
      if (!res.ok) {
        const err = await res.json()
        const errorMessage = err.error?.message || "Failed to load Spotify playlists"
        setSpotify({ loading: false, error: errorMessage, connected: false })
        return []
      }
      
      const data = await res.json() as SpotifyPlaylistResponse
      const spotifyPlaylists: Playlist[] = data.playlists.map((p) => ({
        ...p,
        source: 'spotify' as const
      }))
      
      setSpotify({ loading: false, error: null, connected: true })
      return spotifyPlaylists
    } catch (error) {
      console.error("Failed to fetch Spotify playlists:", error)
      setSpotify({ loading: false, error: "Connection error", connected: false })
      return []
    }
  }

  const fetchYoutubePlaylists = async (): Promise<Playlist[]> => {
    try {
      const res = await fetch("/api/youtube")
      
      if (!res.ok) {
        const err = await res.json()
        const errorMessage = err.error?.message || "Failed to load YouTube playlists"
        setYoutube({ loading: false, error: errorMessage, connected: false })
        return []
      }
      
      const data = await res.json() as YouTubePlaylistResponse
      const youtubePlaylists: Playlist[] = data.playlists.map((p) => ({
        ...p,
        source: 'youtube' as const
      }))
      
      setYoutube({ loading: false, error: null, connected: true })
      return youtubePlaylists
    } catch (error) {
      console.error("Failed to fetch YouTube playlists:", error)
      setYoutube({ loading: false, error: "Connection error", connected: false })
      return []
    }
  }

  const getPlatformIcon = (source: 'spotify' | 'youtube') => {
    if (source === 'spotify') {
      return (
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">S</span>
        </div>
      )
    }
    return (
      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-xs text-white font-bold">Y</span>
      </div>
    )
  }

  const isLoading = spotify.loading || youtube.loading

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">S</span>
              </div>
              <h3 className="text-white font-semibold">Spotify</h3>
            </div>
            {spotify.loading && <p className="text-gray-400 text-sm">Loading...</p>}
            {spotify.error && <p className="text-red-400 text-sm">{spotify.error}</p>}
            {spotify.connected && <p className="text-green-400 text-sm">Connected ✓</p>}
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">Y</span>
              </div>
              <h3 className="text-white font-semibold">YouTube Music</h3>
            </div>
            {youtube.loading && <p className="text-gray-400 text-sm">Loading...</p>}
            {youtube.error && <p className="text-red-400 text-sm">{youtube.error}</p>}
            {youtube.connected && <p className="text-green-400 text-sm">Connected ✓</p>}
          </div>
        </div>

        <div className="bg-pink-900 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-white">
              Your Playlists ({playlists.length})
            </h2>
            <button
              onClick={fetchAllPlaylists}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-pink-900 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading && playlists.length === 0 && (
            <div className="text-center py-8">
              <div className="text-white text-lg">Loading playlists...</div>
            </div>
          )}

          <ul className="space-y-2">
            {playlists.map((playlist) => (
              <li
                key={`${playlist.source}-${playlist.id}`}
                className="bg-zinc-800 rounded p-4 text-white hover:bg-zinc-700 transition"
              >
                <div className="flex items-center space-x-4">
                  {playlist.image && (
                    <Image
                      src={playlist.image}
                      alt={playlist.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getPlatformIcon(playlist.source)}
                      <a
                        href={playlist.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold hover:underline"
                      >
                        {playlist.name}
                      </a>
                    </div>
                    <p className="text-sm text-gray-400">
                      {playlist.tracks} tracks
                    </p>
                    {playlist.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!isLoading && playlists.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400">
                No playlists found. Make sure you have connected your accounts.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}