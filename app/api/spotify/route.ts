import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/auth/[...nextauth]/options";
import client from "@/lib/prisma";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyTracks {
  total: number;
}

interface SpotifyPlaylistItem {
  id: string;
  name: string;
  tracks: SpotifyTracks;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylistResponse {
  items: SpotifyPlaylistItem[];
}

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(AuthOptions);

    if (!session?.user?.email) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await client.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });

    if (!user) {
      return Response.json({ error: { message: "User not found" } }, { status: 404 });
    }

    const spotifyAccount = user.accounts.find(acc => acc.provider === "spotify");

    if (!spotifyAccount?.access_token) {
      return Response.json({
        error: {
          message: "No Spotify account linked. Please connect your Spotify account.",
          action: "CONNECT_SPOTIFY"
        }
      }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    let accessToken = spotifyAccount.access_token;

    if (spotifyAccount.expires_at && spotifyAccount.expires_at < now) {
      if (!spotifyAccount.refresh_token) {
        return Response.json({
          error: {
            message: "Spotify token expired. Please reconnect your Spotify account.",
            action: "RECONNECT_SPOTIFY"
          }
        }, { status: 401 });
      }

      try {
        const refreshResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: spotifyAccount.refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Token refresh failed");
        }

        const refreshData = await refreshResponse.json() as SpotifyTokenResponse;

        await client.account.update({
          where: {
            provider_providerAccountId: {
              provider: "spotify",
              providerAccountId: spotifyAccount.providerAccountId,
            },
          },
          data: {
            access_token: refreshData.access_token,
            expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
            refresh_token: refreshData.refresh_token || spotifyAccount.refresh_token,
          },
        });

        accessToken = refreshData.access_token;
      } catch {
        return Response.json({
          error: {
            message: "Failed to refresh token. Please reconnect your Spotify account.",
            action: "RECONNECT_SPOTIFY"
          }
        }, { status: 401 });
      }
    }

    const spotifyResponse = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await spotifyResponse.json() as SpotifyPlaylistResponse | SpotifyErrorResponse;

    if (!spotifyResponse.ok) {
      const errorData = data as SpotifyErrorResponse;
      return Response.json({ error: errorData.error }, { status: spotifyResponse.status });
    }

    const successData = data as SpotifyPlaylistResponse;
    const playlists = (successData.items || []).map((playlist: SpotifyPlaylistItem) => ({
      id: playlist.id,
      name: playlist.name,
      tracks: playlist.tracks.total,
      image: playlist.images?.[0]?.url || null,
      external_url: playlist.external_urls.spotify,
    }));

    return Response.json({ playlists });

  } catch (error) {
    console.error("Spotify API error:", error);
    return Response.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}