# Co🎵v

A modern, full-stack web application that allows users to seamlessly convert playlists between Spotify and YouTube Music. Built with Next.js 15, TypeScript, and modern authentication.

## ✨ Features

### 🔄 **Universal Playlist Conversion**
- Convert any public playlist between Spotify and YouTube Music
- Intelligent track matching with detailed match rates
- Real-time conversion progress and results

### 🎯 **Two Ways to Convert**
1. **URL-based (No Login Required)**: Paste any playlist URL and convert instantly
2. **Dashboard (Authenticated)**: Connect your accounts to convert your personal playlists

### 🎨 **Modern UI/UX**
- Beautiful glassmorphism design with dark theme
- Responsive layout that works on all devices
- Smooth animations and transitions
- Real-time loading states and progress indicators

### 🔐 **Secure Authentication**
- OAuth integration with Spotify and Google (YouTube Music)
- Automatic token refresh handling
- Secure session management with NextAuth.js

### 📊 **Detailed Analytics**
- Track-by-track conversion results
- Match rate percentages
- Availability status (Found/Not Found/Similar)
- Platform-specific metadata preservation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Spotify Developer Account
- Google Cloud Console Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/playlist-sync.git
   cd playlist-sync
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/playlistsync"
   
   # NextAuth
   NEXTAUTH_URL="http://127.0.0.1:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Spotify OAuth
   SPOTIFY_CLIENT_ID="your-spotify-client-id"
   SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
   
   # Google OAuth  
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # YouTube Data API
   YOUTUBE_API_KEY="your-youtube-api-key"
   ```

4. **Set up the database**
   ```bash
   pnpm prisma db push
   pnpm prisma generate
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://127.0.0.1:3000`

## 🔧 Configuration Guide

### Spotify App Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret to your `.env`

### Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://127.0.0.1:3000/api/auth/callback/google`
6. Create an API key for YouTube Data API
7. Copy credentials to your `.env`

### Database Setup
We recommend using [Neon](https://neon.tech) for a free PostgreSQL database:
1. Create a Neon account
2. Create a new database
3. Copy the connection string to `DATABASE_URL` in your `.env`

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication for Next.js

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Modern database toolkit and ORM
- **PostgreSQL** - Reliable relational database

### APIs & Services
- **Spotify Web API** - Access to Spotify data
- **YouTube Data API v3** - Access to YouTube playlists
- **OAuth 2.0** - Secure user authentication

## 📁 Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth configuration
│   │   ├── convert/        # Playlist conversion logic
│   │   ├── spotify/        # Spotify API integration
│   │   └── youtube/        # YouTube API integration
│   ├── components/         # Reusable UI components
│   ├── dashboard/          # Dashboard page
│   └── page.tsx           # Home page
├── lib/
│   └── prisma.ts          # Database client
├── prisma/
│   └── schema.prisma      # Database schema
└── types/                 # TypeScript type definitions
```

## 🎯 API Endpoints

### Public Endpoints
- `POST /api/convert` - Convert any playlist URL (no auth required)

### Authenticated Endpoints
- `GET /api/spotify` - Fetch user's Spotify playlists
- `GET /api/youtube` - Fetch user's YouTube Music playlists

### Authentication
- `GET/POST /api/auth/*` - NextAuth.js authentication routes


### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for music data
- [YouTube Data API](https://developers.google.com/youtube/v3) for playlist access
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://www.prisma.io/) for database management


---

**Made with 🤍 by [Siddharth Thakkar](https://siddharththakkar.xyz)**

⭐ Star this repo if you found it helpful!