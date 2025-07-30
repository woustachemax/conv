import { getServerSession } from "next-auth"
import { AuthOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { signOut } from "next-auth/react"

export default async function Dashboard() {
  const session = await getServerSession(AuthOptions)
  
  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl text-white mb-4">Welcome, {session.user?.name}!</h2>
          <p className="text-gray-400">Connected accounts will appear here.</p>
        </div>
      </div>
    </div>
  )
}