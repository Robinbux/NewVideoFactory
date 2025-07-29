# AI Video Generator

A sophisticated automated video generator for creating viral short-form content from news articles, perfect for YouTube Shorts and TikTok.

## Features

- **News Article Selection**: Search and browse news articles from various sources
- **AI Script Generation**: Automatically generate engaging scripts using OpenAI GPT-4
- **Media Search**: Find relevant photos and videos from Pexels based on script keywords
- **Voice Generation**: Create natural-sounding voiceovers with ElevenLabs
- **Video Processing**: Combine media, voiceover, and karaoke-style text overlays
- **Professional UI**: Modern, sleek interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **APIs**: News API, OpenAI, ElevenLabs, Pexels
- **Video Processing**: FFmpeg, Canvas API
- **Styling**: Tailwind CSS with custom theme

## Getting Started

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - News API
  - OpenAI
  - ElevenLabs
  - Pexels

### Installation

1. Clone the repository:
```bash
cd video-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```env
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
PEXELS_API_KEY=your_pexels_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select Article**: Search for news articles or browse the latest finance/tech news
2. **Generate Script**: Choose script length (30s, 60s, or 90s) and generate an AI script
3. **Choose Media**: Select photos and videos that match your script from Pexels
4. **Voice Settings**: Pick a voice and adjust parameters for natural speech
5. **Generate Video**: Combine all elements into a professional video
6. **Export**: Preview and download your video

## Video Features

- **Vertical Format**: Optimized for mobile viewing (9:16 aspect ratio)
- **Karaoke Text**: Synchronized word-by-word highlighting
- **Professional Transitions**: Smooth media transitions
- **High Quality**: 1080x1920 resolution output

## API Endpoints

- `/api/news` - Fetch news articles
- `/api/generate-script` - Generate AI scripts
- `/api/search-media` - Search Pexels media
- `/api/generate-voice` - Generate voiceovers
- `/api/generate-video` - Process final video

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

This project is for internal use only.
