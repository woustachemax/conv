import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/auth/[...nextauth]/options";
import client from "@/lib/prisma";

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

    const data = await youtubeResponse.json();
    
    if (!youtubeResponse.ok) {
      if (youtubeResponse.status === 403) {
        const isQuotaExceeded = data.error?.errors?.some((err: any) => err.reason === "quotaExceeded");
        const isApiNotEnabled = data.error?.errors?.some((err: any) => err.reason === "accessNotConfigured");
        
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

      return Response.json({ error: data.error }, { status: youtubeResponse.status });
    }

    const playlists = (data.items || []).map((playlist: any) => ({
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
      total: data.pageInfo?.totalResults || playlists.length,
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