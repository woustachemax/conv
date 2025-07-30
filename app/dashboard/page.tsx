import { getServerSession } from "next-auth"
import { AuthOptions } from "../api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import Logout from "../components/Logout"
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
            <Logout/>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl text-white mb-4">Welcome, {session.user?.name}!</h2>
          <p className="text-gray-400">Connected accounts will appear here.</p>
        </div>
      </div>
    </div>
  )
}