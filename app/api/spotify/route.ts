import { getServerSession } from "next-auth";
import { AuthOptions } from "@/app/api/auth/[...nextauth]/options";
import client from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(AuthOptions);

    if (!session || !session.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await client.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const spotifyAccount = user.accounts.find(
      (acc) => acc.provider === "spotify"
    );

    if (!spotifyAccount?.access_token) {
      console.error("Spotify account not found for user");
      return new Response(
        JSON.stringify({ 
          error: { 
            message: "No Spotify account linked. Please connect your Spotify account.",
            action: "CONNECT_SPOTIFY"
          } 
        }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (spotifyAccount.expires_at && spotifyAccount.expires_at < now) {
      console.error("Spotify token expired for user");
      
      if (spotifyAccount.refresh_token) {
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

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            
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

            const res = await fetch("https://api.spotify.com/v1/me/playlists", {
              headers: {
                Authorization: `Bearer ${refreshData.access_token}`,
              },
            });

            const json = await res.json();
            if (!res.ok) {
              console.error("Spotify API error after token refresh:", res.status);
              return new Response(JSON.stringify({ error: json.error }), {
                status: res.status,
                headers: { "Content-Type": "application/json" },
              });
            }

            const playlists = (json.items || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              tracks: p.tracks.total,
              image: p.images?.[0]?.url ?? null,
              external_url: p.external_urls?.spotify,
            }));

            return new Response(JSON.stringify({ playlists }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      return new Response(
        JSON.stringify({ 
          error: { 
            message: "Spotify token expired. Please reconnect your Spotify account.",
            action: "RECONNECT_SPOTIFY"
          } 
        }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const res = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: {
        Authorization: `Bearer ${spotifyAccount.access_token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("Spotify API error:", res.status);
      return new Response(JSON.stringify({ error: json.error }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const playlists = (json.items || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks.total,
      image: p.images?.[0]?.url ?? null,
      external_url: p.external_urls?.spotify,
    }));

    return new Response(JSON.stringify({ playlists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in Spotify API:", error);
    return new Response(
      JSON.stringify({ error: { message: "Internal server error" } }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}