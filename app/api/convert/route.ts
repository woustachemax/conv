import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { AuthOptions } from '../auth/[...nextauth]/options'
import client from '@/lib/prisma'

interface Track {
  id?: string
  name: string
  artist: string
  duration?: string
  availability?: 'available' | 'unavailable' | 'partial'
  platformId?: string
}

interface PlaylistData {
  name: string
  platform: string
  trackCount: number
  image?: string
  tracks: Track[]
}

interface SpotifyTrackItem {
  track: {
    name: string;
    artists: { name: string }[];
    duration_ms?: number;
    id: string;
  }
}

interface SpotifyPlaylistItem {
  track: {
    name: string;
    artists: { name: string }[];
    duration_ms?: number;
    id: string;
  } | null;
}

interface YouTubePlaylistItem {
  snippet: {
    title: string;
    videoId?: string;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url, targetPlatform, createPlaylist } = await request.json()
    
    const session = await getServerSession(AuthOptions)
    if (createPlaylist && !session?.user?.email) {
      return Response.json(
        { error: { message: 'Authentication required for playlist creation' } },
        { status: 401 }
      )
    }

    if (!url || !targetPlatform) {
      return Response.json(
        { error: { message: 'URL and target platform are required' } },
        { status: 400 }
      )
    }

    const sourcePlatform = detectPlatform(url)
    if (!sourcePlatform) {
      return Response.json(
        { error: { message: 'Unsupported playlist URL format' } },
        { status: 400 }
      )
    }

    const playlistData = await extractPlaylistData(url, sourcePlatform)
    if (!playlistData) {
      return Response.json(
        { error: { message: 'Failed to extract playlist data' } },
        { status: 400 }
      )
    }

    const convertedTracks = await convertTracks(playlistData.tracks, targetPlatform)
    
    const availableTracks = convertedTracks.filter(t => t.availability === 'available').length
    const matchRate = (availableTracks / convertedTracks.length) * 100

    let createdPlaylistUrl = null
    if (createPlaylist && session?.user?.email) {
      createdPlaylistUrl = await createPlaylistOnPlatform(
        playlistData.name,
        convertedTracks.filter(t => t.availability === 'available'),
        targetPlatform,
        session.user.email
      )
    }

    return Response.json({
      originalPlaylist: {
        name: playlistData.name,
        platform: sourcePlatform,
        trackCount: playlistData.trackCount,
        image: playlistData.image
      },
      tracks: convertedTracks,
      targetPlatform,
      matchRate,
      createdPlaylistUrl
    })

  } catch (error) {
    console.error('Conversion error:', error)
    return Response.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

async function createPlaylistOnPlatform(
  playlistName: string,
  tracks: Track[],
  platform: string,
  userEmail: string
): Promise<string | null> {
  switch (platform) {
    case 'spotify':
      return createSpotifyPlaylist(playlistName, tracks, userEmail)
    case 'youtube':
      return createYouTubePlaylist(playlistName, tracks, userEmail)
    default:
      return null
  }
}

async function createSpotifyPlaylist(
  playlistName: string,
  tracks: Track[],
  userEmail: string
): Promise<string | null> {
  try {
    const prisma = client
    const account = await prisma.account.findFirst({
      where: {
        user: { email: userEmail },
        provider: 'spotify'
      }
    })

    if (!account?.access_token) return null

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${account.access_token}` }
    })

    if (!userResponse.ok) return null
    const userData = await userResponse.json()

    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${playlistName} (Converted)`,
        description: 'Converted playlist',
        public: false
      })
    })

    if (!createResponse.ok) return null
    const playlist = await createResponse.json()

    const trackUris = tracks
      .filter(t => t.platformId)
      .map(t => `spotify:track:${t.platformId}`)
      .slice(0, 100)

    if (trackUris.length > 0) {
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      })
    }

    return playlist.external_urls.spotify
  } catch (error) {
    console.error('Spotify playlist creation error:', error)
    return null
  }
}

async function createYouTubePlaylist(
  playlistName: string,
  tracks: Track[],
  userEmail: string
): Promise<string | null> {
  try {
    const prisma = client

    const account = await prisma.account.findFirst({
      where: {
        user: { email: userEmail },
        provider: 'google'
      }
    })

    if (!account?.access_token) {
      return null
    }

    const createResponse = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          title: `${playlistName} (Converted)`,
          description: 'Converted playlist'
        },
        status: {
          privacyStatus: 'private'
        }
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('YouTube playlist creation failed:', errorText)
      
      if (createResponse.status === 403) {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          console.error('YouTube quota exceeded - Cannot create playlist')
          return null
        }
      }
      
      return null
    }

    const playlist = await createResponse.json()

    for (const track of tracks.filter(t => t.platformId)) {
      try {
        const addResponse = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            snippet: {
              playlistId: playlist.id,
              resourceId: {
                kind: 'youtube#video',
                videoId: track.platformId
              }
            }
          })
        })
        
        if (!addResponse.ok) {
          const errorText = await addResponse.text()
          if (addResponse.status === 403) {
            const errorData = JSON.parse(errorText)
            if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
              console.error('YouTube quota exceeded - Stopping track addition')
              break
            }
          }
          console.error(`Failed to add track ${track.name}:`, errorText)
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (trackError) {
        console.error(`Failed to add track ${track.name}:`, trackError)
      }
    }

    return `https://music.youtube.com/playlist?list=${playlist.id}`
  } catch (error) {
    console.error('YouTube playlist creation error:', error)
    return null
  }
}

function detectPlatform(url: string): string | null {
  if (url.includes('open.spotify.com/playlist/')) return 'spotify'
  if (url.includes('music.youtube.com/playlist') || url.includes('youtube.com/playlist')) return 'youtube'
  if (url.includes('music.apple.com/')) return 'apple'
  return null
}

async function extractPlaylistData(url: string, platform: string): Promise<PlaylistData | null> {
  switch (platform) {
    case 'spotify':
      return extractSpotifyPlaylist(url)
    case 'youtube':
      return extractYouTubePlaylist(url)
    case 'apple':
      return extractApplePlaylist(url)
    default:
      return null
  }
}

async function extractSpotifyPlaylist(url: string): Promise<PlaylistData | null> {
  try {
    const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1]
    if (!playlistId) return null

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) return null
    const tokenData = await tokenResponse.json()

    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    )

    if (!playlistResponse.ok) return null
    const playlist = await playlistResponse.json()

    const tracks: Track[] = []
    let next = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`
    
    while (next) {
      const tracksResponse = await fetch(next, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
      
      if (!tracksResponse.ok) break
      const tracksData = await tracksResponse.json()
      
      tracksData.items?.forEach((item: SpotifyPlaylistItem) => {
        if (item.track && item.track.name) {
          tracks.push({
            name: item.track.name,
            artist: item.track.artists?.[0]?.name || 'Unknown Artist',
            duration: item.track.duration_ms ? Math.floor(item.track.duration_ms / 1000).toString() : undefined
          })
        }
      })
      
      next = tracksData.next
    }

    return {
      name: playlist.name,
      platform: 'spotify',
      trackCount: tracks.length,
      image: playlist.images?.[0]?.url,
      tracks
    }
  } catch (error) {
    console.error('Spotify extraction error:', error)
    return null
  }
}

async function extractYouTubePlaylist(url: string): Promise<PlaylistData | null> {
  try {
    const playlistId = url.match(/[?&]list=([^&]+)/)?.[1]
    if (!playlistId) return null

    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?` +
      new URLSearchParams({
        part: 'snippet,contentDetails',
        id: playlistId,
        key: process.env.YOUTUBE_API_KEY!
      })
    )

    if (!playlistResponse.ok) return null
    const playlistData = await playlistResponse.json()
    
    if (!playlistData.items?.[0]) return null
    const playlist = playlistData.items[0]

    const tracks: Track[] = []
    let pageToken = ''
    
    do {
      const itemsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?` +
        new URLSearchParams({
          part: 'snippet',
          playlistId: playlistId,
          maxResults: '50',
          pageToken,
          key: process.env.YOUTUBE_API_KEY!
        })
      )
      
      if (!itemsResponse.ok) break
      const itemsData = await itemsResponse.json()
      
      itemsData.items?.forEach((item: YouTubePlaylistItem) => {
        const title = item.snippet?.title
        if (title && title !== 'Deleted video' && title !== 'Private video') {
          const { artist, name } = parseYouTubeTitle(title)
          
          tracks.push({
            name: name,
            artist: artist
          })
        }
      })
      
      pageToken = itemsData.nextPageToken || ''
    } while (pageToken)

    return {
      name: playlist.snippet.title,
      platform: 'youtube',
      trackCount: tracks.length,
      image: playlist.snippet.thumbnails?.medium?.url,
      tracks
    }
  } catch (error) {
    console.error('YouTube extraction error:', error)
    return null
  }
}

function parseYouTubeTitle(title: string): { artist: string; name: string } {
  const separators = [' - ', ' – ', ' — ', ' | ', ': ', ' by ']
  
  for (const separator of separators) {
    if (title.includes(separator)) {
      const parts = title.split(separator)
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          name: parts.slice(1).join(separator).trim()
        }
      }
    }
  }

  const cleanTitle = title
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*(official|music|video|lyric|audio|hd|4k|mv|live|acoustic|cover|remix)\s*(video|audio|version)?.*$/i, '')
    .trim()

  return {
    artist: 'Unknown Artist',
    name: cleanTitle || title
  }
}

async function extractApplePlaylist(url: string): Promise<PlaylistData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return null
    const html = await response.text()
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/)
    const name = titleMatch ? titleMatch[1].split(' - ')[0] : 'Apple Music Playlist'
    
    return {
      name,
      platform: 'apple',
      trackCount: 0,
      tracks: []
    }
  } catch (error) {
    console.error('Apple Music extraction error:', error)
    return null
  }
}

async function convertTracks(tracks: Track[], targetPlatform: string): Promise<Track[]> {
  const convertedTracks: Track[] = []
  
  for (const track of tracks) {
    let searchQuery: string
    
    if (track.artist === 'Unknown Artist') {
      searchQuery = track.name.trim()
    } else {
      searchQuery = `${track.artist} ${track.name}`.trim()
    }
    
    let availability: 'available' | 'unavailable' | 'partial' = 'unavailable'
    let platformId: string | undefined
    
    try {
      const result = await searchTrackOnPlatform(searchQuery, targetPlatform)
      availability = result.found ? 'available' : 'unavailable'
      platformId = result.id
    } catch (searchError) {
      console.error(`Search error for "${searchQuery}":`, searchError)
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    convertedTracks.push({
      ...track,
      availability,
      platformId
    })
  }
  
  return convertedTracks
}

async function searchTrackOnPlatform(query: string, platform: string): Promise<{found: boolean, id?: string}> {
  console.log(`Searching for: "${query}" on ${platform}`) 
  switch (platform) {
    case 'spotify':
      return searchSpotifyTrack(query)
    case 'youtube':
      return searchYouTubeTrack(query)
    case 'apple':
      return searchAppleTrack(query)
    default:
      return {found: false}
  }
}

async function searchSpotifyTrack(query: string): Promise<{found: boolean, id?: string}> {
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) return {found: false}
    const tokenData = await tokenResponse.json()

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?` + 
      new URLSearchParams({
        q: query.trim(),
        type: 'track',
        limit: '1'
      }),
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    )

    if (!searchResponse.ok) return {found: false}
    const searchData: SpotifySearchResponse = await searchResponse.json()
    
    const track = searchData.tracks?.items?.[0]
    return {
      found: !!track,
      id: track?.id
    }
  } catch (spotifyError) {
    console.error('Spotify search error:', spotifyError)
    return {found: false}
  }
}

async function searchYouTubeTrack(query: string): Promise<{found: boolean, id?: string}> {
  if (process.env.YOUTUBE_MOCK_MODE === 'true') {
    console.log(`MOCK: yt search query: "${query}"`)
    const mockFound = Math.random() > 0.2
    return {
      found: mockFound,
      id: mockFound ? `mock_video_${Math.random().toString(36).substr(2, 9)}` : undefined
    }
  }

  try {
    console.log(`yt search query: "${query}"`)
    
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: 'snippet',
        q: query.trim(),
        type: 'video',
        maxResults: '1',
        key: process.env.YOUTUBE_API_KEY!
      })
    )

    console.log(`yt api res: ${searchResponse.status}`)
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.log(`yt api err: ${errorText}`)
      
      if (searchResponse.status === 403 || searchResponse.status === 429) {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          console.log('YouTube quota exceeded - marking as unavailable')
          return {found: false}
        }
      }
      return {found: false}
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json()
    console.log(`yt res count: ${searchData.items?.length || 0}`)
    
    const video = searchData.items?.[0]
    return {
      found: !!video,
      id: video?.id?.videoId
    }
  } catch (youtubeError) {
    console.log(`yt search err: ${youtubeError}`) 
    return {found: false}
  }
}

async function searchAppleTrack(query: string): Promise<{found: boolean, id?: string}> {
  try {
    const searchResponse = await fetch(
      `https://itunes.apple.com/search?` +
      new URLSearchParams({
        term: query,
        media: 'music',
        entity: 'song',
        limit: '1'
      })
    )

    if (!searchResponse.ok) return {found: false}
    const searchData = await searchResponse.json()
    
    const track = searchData.results?.[0]
    return {
      found: !!track,
      id: track?.trackId?.toString()
    }
  } catch (appleError) {
    console.error('Apple search error:', appleError)
    return {found: false}
  }
}