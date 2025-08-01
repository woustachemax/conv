import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/auth/[...nextauth]/options";
import client from "@/lib/prisma";

interface YouTubeErrorDetail {
  reason: string;
  message: string;
}

interface YouTubeError {
  code: number;
  message: string;
  errors: YouTubeErrorDetail[];
}

interface YouTubeErrorResponse {
  error: YouTubeError;
}

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
}

interface YouTubePlaylistSnippet {
  title: string;
  description: string;
  publishedAt: string;
  thumbnails?: YouTubeThumbnails;
}

interface YouTubePlaylistContentDetails {
  itemCount: number;
}

interface YouTubePlaylistStatus {
  privacyStatus: string;
}

interface YouTubePlaylistItem {
  id: string;
  snippet: YouTubePlaylistSnippet;
  contentDetails: YouTubePlaylistContentDetails;
  status?: YouTubePlaylistStatus;
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  pageInfo?: {
    totalResults: number;
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

    const googleAccount = user.accounts.find(acc => acc.provider === "google");

    if (!googleAccount?.access_token) {
      return Response.json({
        error: {
          message: "No Google account linked. Please connect your Google account.",
          action: "CONNECT_GOOGLE"
        }
      }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    let accessToken = googleAccount.access_token;

    if (googleAccount.expires_at && googleAccount.expires_at < now) {
      if (!googleAccount.refresh_token) {
        return Response.json({
          error: {
            message: "Google token expired. Please reconnect your account.",
            action: "RECONNECT_GOOGLE"
          }
        }, { status: 401 });
      }

      try {
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: googleAccount.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Token refresh failed");
        }

        const refreshData = await refreshResponse.json();

        await client.account.update({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: googleAccount.providerAccountId,
            },
          },
          data: {
            access_token: refreshData.access_token,
            expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
            refresh_token: refreshData.refresh_token || googleAccount.refresh_token,
          },
        });

        accessToken = refreshData.access_token;
      } catch {
        return Response.json({
          error: {
            message: "Failed to refresh token. Please reconnect your account.",
            action: "RECONNECT_GOOGLE"
          }
        }, { status: 401 });
      }
    }

    const hasYouTubeScope = googleAccount.scope?.includes("https://www.googleapis.com/auth/youtube") || 
                           googleAccount.scope?.includes("youtube");

    if (!hasYouTubeScope) {
      return Response.json({
        error: {
          message: "YouTube access not granted. Please reconnect with YouTube permissions.",
          action: "RECONNECT_GOOGLE_YOUTUBE"
        }
      }, { status: 403 });
    }

    const youtubeResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?" + 
      new URLSearchParams({
        part: "snippet,contentDetails,status",
        mine: "true",
        maxResults: "50",
      }), 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await youtubeResponse.json() as YouTubePlaylistResponse | YouTubeErrorResponse;
    
    if (!youtubeResponse.ok) {
      if (youtubeResponse.status === 403) {
        const errorData = data as YouTubeErrorResponse;
        const isQuotaExceeded = errorData.error?.errors?.some((err: YouTubeErrorDetail) => err.reason === "quotaExceeded");
        const isApiNotEnabled = errorData.error?.errors?.some((err: YouTubeErrorDetail) => err.reason === "accessNotConfigured");
        
        if (isQuotaExceeded) {
          return Response.json({
            error: {
              message: "YouTube API quota exceeded. Please try again later.",
              action: "RETRY_LATER"
            }
          }, { status: 429 });
        }
        
        if (isApiNotEnabled) {
          return Response.json({
            error: {
              message: "YouTube Data API is not enabled. Please enable it in Google Cloud Console.",
              action: "ENABLE_API"
            }
          }, { status: 403 });
        }
      }

      return Response.json({ error: (data as YouTubeErrorResponse).error }, { status: youtubeResponse.status });
    }

    const successData = data as YouTubePlaylistResponse;
    const playlists = (successData.items || []).map((playlist: YouTubePlaylistItem) => ({
      id: playlist.id,
      name: playlist.snippet.title,
      description: playlist.snippet.description || "",
      tracks: playlist.contentDetails.itemCount,
      image: playlist.snippet.thumbnails?.medium?.url || 
             playlist.snippet.thumbnails?.default?.url || 
             null,
      external_url: `https://www.youtube.com/playlist?list=${playlist.id}`,
      created_at: playlist.snippet.publishedAt,
      privacy: playlist.status?.privacyStatus || "unknown",
    }));

    return Response.json({
      playlists,
      total: successData.pageInfo?.totalResults || playlists.length,
      source: "youtube"
    });

  } catch (error) {
    console.error("YouTube API error:", error);
    return Response.json(
      { error: { message: "Internal server error" } }, 
      { status: 500 }
    );
  }
}