import { NextResponse } from 'next/server';
import axios from 'axios';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/v1';
const PEXELS_VIDEO_API_URL = 'https://api.pexels.com/videos';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'both'; // photo, video, or both
  const perPage = searchParams.get('perPage') || '20';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results: any = {
      photos: [],
      videos: [],
    };

    const headers = {
      Authorization: PEXELS_API_KEY,
    };

    // Fetch photos
    if (type === 'photo' || type === 'both') {
      const photoResponse = await axios.get(`${PEXELS_API_URL}/search`, {
        headers,
        params: {
          query,
          per_page: perPage,
          orientation: 'portrait', // Vertical format for shorts
        },
      });
      results.photos = photoResponse.data.photos.map((photo: any) => ({
        id: photo.id,
        url: photo.src.original,
        thumbnail: photo.src.medium,
        alt: photo.alt,
        photographer: photo.photographer,
        type: 'photo',
      }));
    }

    // Fetch videos
    if (type === 'video' || type === 'both') {
      const videoResponse = await axios.get(`${PEXELS_VIDEO_API_URL}/search`, {
        headers,
        params: {
          query,
          per_page: perPage,
          orientation: 'portrait',
        },
      });
      results.videos = videoResponse.data.videos.map((video: any) => ({
        id: video.id,
        url: video.video_files.find((f: any) => f.quality === 'hd')?.link || video.video_files[0].link,
        thumbnail: video.image,
        duration: video.duration,
        type: 'video',
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching media:', error);
    return NextResponse.json(
      { error: 'Failed to search media' },
      { status: 500 }
    );
  }
}