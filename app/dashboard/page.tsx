"use client"

import { useEffect, useState, useCallback } from "react"
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
  const { status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [spotify, setSpotify] = useState<PlatformStatus>({ loading: false, error: null, connected: false })
  const [youtube, setYoutube] = useState<PlatformStatus>({ loading: false, error: null, connected: false })

  const fetchAllPlaylists = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (status === "authenticated") {
      fetchAllPlaylists()
    }
  }, [status, router, fetchAllPlaylists])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="text-white text-xl relative z-10">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-slate-100/5"/>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-slate-100/5"/>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Your Music Library</h1>
            <Logout />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm text-white font-bold">S</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg">Spotify</h3>
                </div>
                {spotify.loading && <p className="text-white/60 text-sm">Loading...</p>}
                {spotify.error && <p className="text-red-400 text-sm">{spotify.error}</p>}
                {spotify.connected && <p className="text-green-400 text-sm font-medium">Connected ✓</p>}
              </div>
            </div>

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm text-white font-bold">Y</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg">YouTube Music</h3>
                </div>
                {youtube.loading && <p className="text-white/60 text-sm">Loading...</p>}
                {youtube.error && <p className="text-red-400 text-sm">{youtube.error}</p>}
                {youtube.connected && <p className="text-green-400 text-sm font-medium">Connected ✓</p>}
              </div>
            </div>
          </div>

          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/2 to-white/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-white font-semibold">
                  Your Playlists ({playlists.length})
                </h2>
                <button
                  onClick={fetchAllPlaylists}
                  disabled={isLoading}
                  className="relative py-3 px-6 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-white/8 hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </button>
              </div>

              {isLoading && playlists.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-white text-lg">Loading playlists...</div>
                </div>
              )}

              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <div
                    key={`${playlist.source}-${playlist.id}`}
                    className="relative bg-white/3 backdrop-blur-md border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:bg-white/5 hover:border-white/10 group"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/2 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center space-x-4">
                      {playlist.image && (
                        <div className="relative">
                          <Image
                            src={playlist.image}
                            alt={playlist.name}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-xl object-cover shadow-lg"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none"></div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getPlatformIcon(playlist.source)}
                          <a
                            href={playlist.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-semibold text-white hover:text-white/80 transition-colors duration-200"
                          >
                            {playlist.name}
                          </a>
                        </div>
                        <p className="text-sm text-white/60 mb-1">
                          {playlist.tracks} tracks
                        </p>
                        {playlist.description && (
                          <p className="text-sm text-white/50 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!isLoading && playlists.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-white/60 text-lg">
                    No playlists found. Make sure you have connected your accounts.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}