'use client'

export const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="relative inline-flex items-center rounded-full px-6 py-2 text-sm text-neutral-100 font-medium bg-white/5 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] mb-8 hover:shadow-amber-300/30">
        Seamlessly transfer your playlists across platforms, fast, easy, and secure. ✨
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
        Transfer Your Music
        <span className="block text-white/20">
          Across All Platforms
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-neutral-300 mb-12 max-w-2xl leading-relaxed">
        Move your carefully curated playlists between Spotify, Apple Music, YouTube Music, and more. 
        Keep your music with you, wherever you go.
      </p>
      
     <div className="flex items-center gap-4 max-w-xl w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Paste your playlist link here..."
            className="w-full py-3 px-8 rounded-full text-white placeholder-white/50 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 focus:bg-white/8 transition-all duration-500"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/3 via-transparent to-white/8 pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/2 to-white/5 pointer-events-none"></div>
        </div>
        
        <button className="relative py-3 px-8 rounded-full text-white font-medium bg-white/5 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-white/8 hover:border-white/15 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.15),0_12px_40px_rgba(0,0,0,0.3)] active:scale-98">
          Paste
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/3 to-white/8 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </button>
      </div>


    </div>
  )
}
