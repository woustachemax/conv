"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Logout from "../components/Logout"

interface Playlist {
  id: string;
  name: string;
  tracks: number;
  image: string | null;
  external_url: string;
  source: 'spotify' | 'youtube';
  description?: string;
}

interface PlatformStatus {
  loading: boolean;
  error: string | null;
  connected: boolean;
}

interface Track {
  id?: string
  name: string
  artist: string
  duration?: string
  availability?: 'available' | 'unavailable' | 'partial'
}

interface ConversionResult {
  originalPlaylist: {
    name: string
    platform: string
    trackCount: number
    image?: string
  }
  tracks: Track[]
  targetPlatform: string
  matchRate: number
  createdPlaylistUrl?: string | null
}

export default function Dashboard() {
  const { status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [spotify, setSpotify] = useState<PlatformStatus>({ loading: false, error: null, connected: false })
  const [youtube, setYoutube] = useState<PlatformStatus>({ loading: false, error: null, connected: false })
  const [converting, setConverting] = useState<string | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)

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

  const fetchSpotifyPlaylists = async (): Promise<Playlist[]> => {
    try {
      const res = await fetch("/api/spotify")
      
      if (!res.ok) {
        const err = await res.json()
        const errorMessage = err.error?.message || "Failed to load Spotify playlists"
        setSpotify({ loading: false, error: errorMessage, connected: false })
        return []
      }
      
      const data = await res.json()
      const spotifyPlaylists: Playlist[] = data.playlists.map((p: any) => ({
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
      
      const data = await res.json()
      const youtubePlaylists: Playlist[] = data.playlists.map((p: any) => ({
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

  const handleConvertPlaylist = async (playlist: Playlist) => {
    const targetPlatform = playlist.source === 'spotify' ? 'youtube' : 'spotify'
    setConverting(playlist.id)

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: playlist.external_url,
          targetPlatform,
          createPlaylist: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Conversion failed')
      }

      setConversionResult(data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed'
      alert(errorMessage)
    } finally {
      setConverting(null)
    }
  }

  const getPlatformIcon = (source: 'spotify' | 'youtube') => {
    if (source === 'spotify') {
      return (
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-sm sm:text-base text-white font-bold">S</span>
        </div>
      )
    }
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
        <span className="text-sm sm:text-base text-white font-bold">Y</span>
      </div>
    )
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

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

  const isLoading = spotify.loading || youtube.loading

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="text-white text-xl relative z-10">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (conversionResult) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="relative z-10 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Conversion Complete!</h2>
              <button
                onClick={() => setConversionResult(null)}
                className="text-white/60 hover:text-white transition-colors text-sm sm:text-base"
              >
                ← Back to Dashboard
              </button>
            </div>
            
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{conversionResult.originalPlaylist.name}</h3>
                  <p className="text-sm text-green-400">
                    {conversionResult.originalPlaylist.platform} → {conversionResult.targetPlatform}
                  </p>
                  <p className="text-sm text-white/60">{conversionResult.originalPlaylist.trackCount} tracks</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-white">{Math.round(conversionResult.matchRate)}%</p>
                  <p className="text-sm text-white/60">Match Rate</p>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {conversionResult.tracks.map((track, index) => (
                  <div 
                    key={track.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      track.availability === 'available' ? 'bg-green-500/10 border border-green-500/20' :
                      track.availability === 'unavailable' ? 'bg-red-500/10 border border-red-500/20' :
                      'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-white/60 text-sm truncate">{track.artist}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      {track.availability === 'available' && <span className="text-green-400 text-sm">✓</span>}
                      {track.availability === 'unavailable' && <span className="text-red-400 text-sm">✗</span>}
                      {track.availability === 'partial' && <span className="text-yellow-400 text-sm">~</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-slate-100/5"/>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-slate-100/5"/>
      </div>
      
      <div className="relative z-10 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <Logout />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs sm:text-sm text-white font-bold">S</span>
                  </div>
                  <h3 className="text-white font-semibold text-base sm:text-lg">Spotify</h3>
                </div>
                {spotify.loading && <p className="text-white/60 text-sm">Loading...</p>}
                {spotify.error && <p className="text-red-400 text-sm">{spotify.error}</p>}
                {spotify.connected && <p className="text-green-400 text-sm font-medium">Connected ✓</p>}
              </div>
            </div>

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs sm:text-sm text-white font-bold">Y</span>
                  </div>
                  <h3 className="text-white font-semibold text-base sm:text-lg">YouTube Music</h3>
                </div>
                {youtube.loading && <p className="text-white/60 text-sm">Loading...</p>}
                {youtube.error && <p className="text-red-400 text-sm">{youtube.error}</p>}
                {youtube.connected && <p className="text-green-400 text-sm font-medium">Connected ✓</p>}
              </div>
            </div>
          </div>

          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-t from-transparent via-white/2 to-white/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl sm:text-2xl text-white font-semibold">
                  Your Playlists ({playlists.length})
                </h2>
                <button
                  onClick={fetchAllPlaylists}
                  disabled={isLoading}
                  className="relative py-2 px-4 sm:py-3 sm:px-6 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-white/8 hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </button>
              </div>

              {isLoading && playlists.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-white text-base sm:text-lg">Loading playlists...</div>
                </div>
              )}

              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <div
                    key={`${playlist.source}-${playlist.id}`}
                    className="relative bg-white/3 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:bg-white/5 hover:border-white/10 group"
                  >
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/2 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getPlatformIcon(playlist.source)}
                        <div className="flex-1 min-w-0">
                          <a
                            href={playlist.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm sm:text-lg font-semibold text-white hover:text-white/80 transition-colors duration-200 truncate mb-1"
                            title={playlist.name}
                          >
                            {truncateText(playlist.name, 30)}
                          </a>
                          <p className="text-xs sm:text-sm text-white/60">
                            {playlist.tracks} tracks
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleConvertPlaylist(playlist)}
                        disabled={converting === playlist.id}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-full text-blue-300 hover:text-blue-200 text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {converting === playlist.id ? 'Converting...' : 
                         `To ${playlist.source === 'spotify' ? 'YT' : 'Spotify'}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!isLoading && playlists.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-white/60 text-base sm:text-lg">
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