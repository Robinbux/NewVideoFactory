import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { article, length } = await request.json();

    if (!article) {
      return NextResponse.json(
        { error: 'Article content is required' },
        { status: 400 }
      );
    }

    const wordCount = length === 'short' ? 150 : length === 'medium' ? 300 : 500;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional video script writer specializing in creating engaging, viral content for YouTube Shorts and TikTok. Your scripts should be conversational, hook viewers immediately, and maintain high engagement throughout. Format the output as a JSON object with the following structure:
          {
            "hook": "A compelling opening line that grabs attention",
            "script": "The main script content with natural pauses marked as [pause]",
            "keywords": ["keyword1", "keyword2", ...] // 5-8 keywords for visual search
          }`
        },
        {
          role: "user",
          content: `Create an engaging ${wordCount}-word video script based on this article: "${article.title}". Summary: ${article.description || article.content}. 
          
          Requirements:
          - Start with a strong hook
          - Use conversational language
          - Include natural pauses for emphasis
          - Suggest 5-8 keywords for relevant visuals
          - Make it suitable for vertical video format
          - Focus on the most interesting/surprising aspects`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const scriptData = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      ...scriptData,
      metadata: {
        wordCount: scriptData.script?.split(' ').length || 0,
        estimatedDuration: Math.ceil((scriptData.script?.split(' ').length || 0) / 150 * 60), // 150 words per minute
      }
    });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}