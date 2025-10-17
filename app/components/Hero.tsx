'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'

interface Track {
  id: string
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
}

export const Hero = () => {
  const { data: session } = useSession()
  const [url, setUrl] = useState('')
  const [targetPlatform, setTargetPlatform] = useState<'spotify' | 'youtube' | 'apple'>('spotify')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)


  const detectPlatform = (url: string): string | null => {
    if (url.includes('open.spotify.com/playlist/')) return 'spotify'
    if (url.includes('music.youtube.com/playlist') || url.includes('youtube.com/playlist')) return 'youtube'
    if (url.includes('music.apple.com/')) return 'apple'
    return null
  }

  useEffect(() => {
  if (typeof window !== 'undefined') {
    const pending = sessionStorage.getItem('pendingConversion')
    if (pending) {
      setIsRedirecting(true)
    }
  }
  }, [])


  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a playlist URL')
      return
    }

    const sourcePlatform = detectPlatform(url)
    if (!sourcePlatform) {
      setError('Please enter a valid Spotify, YouTube Music, or Apple Music playlist URL')
      return
    }

    if (sourcePlatform === targetPlatform) {
      setError('Source and target platforms cannot be the same')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          targetPlatform,
          createPlaylist: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Conversion failed')
      }

      setResult(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during conversion'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'spotify': return 'Spotify'
      case 'youtube': return 'YouTube Music'
      case 'apple': return 'Apple Music'
      default: return platform
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'spotify': return 'text-green-400'
      case 'youtube': return 'text-red-400'
      case 'apple': return 'text-gray-300'
      default: return 'text-white'
    }
  }

  const handleCreatePlaylist = async () => {
    if (!session) {
      if (result) {
        sessionStorage.setItem('pendingConversion', JSON.stringify({
          url: url.trim(),
          targetPlatform: result.targetPlatform,
          playlistName: result.originalPlaylist.name
        }))
      }
      
      if (result?.targetPlatform === 'youtube') {
        signIn('google', { callbackUrl: '/dashboard' })
      } else if (result?.targetPlatform === 'spotify') {
        signIn('spotify', { callbackUrl: '/dashboard' })
      } else {
        signIn('spotify', { callbackUrl: '/dashboard' })
      }
      return
    }

    if (!result) return

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          targetPlatform: result.targetPlatform,
          createPlaylist: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Playlist creation failed')
      }

      if (data.createdPlaylistUrl) {
        window.open(data.createdPlaylistUrl, '_blank')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Playlist creation failed'
      alert(errorMessage)
    }
  }

  if (isRedirecting) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-white text-xl">Completing conversion...</div>
    </div>
    )
  }


  if (result) {
    return (
      <div className="flex flex-col items-center justify-start text-center px-4 py-20">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Conversion Complete!
          </h2>
          
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-white mb-2">{result.originalPlaylist.name}</h3>
                <p className={`text-sm ${getPlatformColor(result.originalPlaylist.platform)}`}>
                  {getPlatformName(result.originalPlaylist.platform)} • {result.originalPlaylist.trackCount} tracks
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{Math.round(result.matchRate)}%</p>
                <p className="text-sm text-white/60">Match Rate</p>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-hide">
              {result.tracks.map((track, index) => (
                <div 
                  key={track.id || index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    track.availability === 'available' ? 'bg-green-500/10 border border-green-500/20' :
                    track.availability === 'unavailable' ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-white font-medium">{track.name}</p>
                    <p className="text-white/60 text-sm">{track.artist}</p>
                  </div>
                  <div className="text-right">
                    {track.availability === 'available' && <span className="text-green-400 text-sm">✓ Found</span>}
                    {track.availability === 'unavailable' && <span className="text-red-400 text-sm">✗ Not Found</span>}
                    {track.availability === 'partial' && <span className="text-yellow-400 text-sm">~ Similar</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setResult(null)
                setUrl('')
                setError('')
              }}
              className="py-3 px-8 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 transition-all duration-300"
            >
              Convert Another
            </button>
            <button 
              onClick={handleCreatePlaylist}
              className="py-3 px-8 rounded-full text-white font-medium bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300"
            >
              {session ? 'Create Playlist' : 'Create Playlist (Login Required)'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
      <div className="relative inline-flex items-center rounded-full px-6 py-2 text-sm text-neutral-100 font-medium bg-white/5 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] mb-8 hover:border-amber-400/30 hover:text-amber-100">
        Seamlessly transfer your playlists across platforms, fast, easy, and secure. ✨
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
        Transfer Your Music
        <span className="block text-white/20">
          Across All Platforms
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl leading-relaxed">
        Move your carefully curated playlists between Spotify, Apple Music, YouTube Music, and more. 
        Keep your music with you, wherever you go.
      </p>
      
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
              placeholder="Paste your playlist link here..."
              className="w-full py-4 px-8 rounded-full text-white placeholder-white/50 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 focus:bg-white/8 transition-all duration-500"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/2 to-white/5 pointer-events-none"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="text-white/60">Convert to:</span>
          {(['spotify', 'youtube'] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setTargetPlatform(platform)}
              className={`py-2 px-4 rounded-full transition-all duration-300 ${
                targetPlatform === platform
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {getPlatformName(platform)}
            </button>
          ))}
          <span className="text-white/40 text-xs">(Apple Music coming soon)</span>
        </div>
        
        <button 
          onClick={handleConvert}
          disabled={loading}
          className="relative py-4 px-12 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-gray-700 hover:text-gray-200 hover:border-white/15 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.15),0_12px_40px_rgba(0,0,0,0.3)] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Converting...' : 'Convert Playlist'}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/3 to-white/8 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </button>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}