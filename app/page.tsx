import { getServerSession } from "next-auth"
import { AuthOptions } from "./api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import LoginButtons from "./components/Login"

export default async function Home() {
  const session = await getServerSession(AuthOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-zinc-900 to-pink-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Conv
          </h1>
          <p className=" text-gray-400">
            Convert playlists between Spotify, YouTube Music, and Apple Music
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <LoginButtons />
        </div>
      </div>
    </div>
  )
}