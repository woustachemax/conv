import { getServerSession } from "next-auth"
import { AuthOptions } from "./api/auth/[...nextauth]/options"
import { redirect } from "next/navigation"
import { Container } from "./components/Container"
import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"

export default async function Home() {
  const session = await getServerSession(AuthOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-slate-100/5"/>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-slate-100/5"/>
      </div>
      
      <div className="relative z-10">
        <Container>
          <Navbar/>
          <Hero/>
        </Container>
      </div>
      
      <footer className="relative z-10 text-white/60 text-center py-8 mt-auto">
        <p>
          Made with 🤍 by{' '}
          <a 
            href="https://siddharththakkar.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white/60"
          >
            Siddharth
          </a>
        </p>
      </footer>
    </div>
  )
}