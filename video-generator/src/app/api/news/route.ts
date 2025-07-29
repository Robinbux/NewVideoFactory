import { NextResponse } from 'next/server';
import axios from 'axios';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'finance';
  const category = searchParams.get('category') || 'business';
  const page = searchParams.get('page') || '1';

  try {
    const response = await axios.get(`${NEWS_API_URL}/everything`, {
      params: {
        q: query,
        category,
        page,
        pageSize: 20,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey: NEWS_API_KEY,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news articles' },
      { status: 500 }
    );
  }
}