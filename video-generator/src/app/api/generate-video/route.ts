import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas, registerFont, loadImage } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import sharp from 'sharp';

ffmpeg.setFfmpegPath(ffmpegPath.path);

// Helper function to download media
async function downloadMedia(url: string, outputPath: string) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  
  const writer = require('fs').createWriteStream(outputPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Helper function to create text overlay frames
async function createTextOverlayFrames(text: string, duration: number, outputDir: string) {
  const words = text.split(' ');
  const wordsPerSecond = words.length / duration;
  const frameRate = 30;
  const totalFrames = duration * frameRate;
  
  const canvas = createCanvas(1080, 1920); // Vertical format
  const ctx = canvas.getContext('2d');
  
  // Create frames
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / frameRate;
    const wordIndex = Math.floor(currentTime * wordsPerSecond);
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Set text style
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw current and nearby words with karaoke effect
    const displayWords = [];
    for (let i = Math.max(0, wordIndex - 2); i <= Math.min(words.length - 1, wordIndex + 2); i++) {
      if (i === wordIndex) {
        displayWords.push(`<span style="color: #FFD700">${words[i]}</span>`);
      } else {
        displayWords.push(words[i]);
      }
    }
    
    // Draw text with word wrapping
    const text = displayWords.join(' ');
    const maxWidth = 900;
    const lineHeight = 80;
    const lines = [];
    let currentLine = '';
    
    text.split(' ').forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);
    
    // Draw lines
    const startY = 1920 - 300;
    lines.forEach((line, index) => {
      // Highlight current word
      if (line.includes(words[wordIndex])) {
        const parts = line.split(words[wordIndex]);
        const beforeWidth = ctx.measureText(parts[0]).width;
        const wordWidth = ctx.measureText(words[wordIndex]).width;
        
        // Draw text before highlighted word
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(parts[0], 540 - ctx.measureText(line).width / 2, startY + index * lineHeight);
        
        // Draw highlighted word
        ctx.fillStyle = '#FFD700';
        ctx.fillText(words[wordIndex], 540 - ctx.measureText(line).width / 2 + beforeWidth, startY + index * lineHeight);
        
        // Draw text after highlighted word
        ctx.fillStyle = '#FFFFFF';
        if (parts[1]) {
          ctx.fillText(parts[1], 540 - ctx.measureText(line).width / 2 + beforeWidth + wordWidth, startY + index * lineHeight);
        }
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, 540, startY + index * lineHeight);
      }
    });
    
    // Save frame
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(path.join(outputDir, `frame_${frame.toString().padStart(5, '0')}.png`), buffer);
  }
}

export async function POST(request: Request) {
  const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
  
  try {
    const { script, media, audio, duration } = await request.json();
    
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Download media files
    const mediaFiles = [];
    for (let i = 0; i < media.length; i++) {
      const mediaItem = media[i];
      const ext = mediaItem.type === 'video' ? 'mp4' : 'jpg';
      const mediaPath = path.join(tempDir, `media_${i}.${ext}`);
      await downloadMedia(mediaItem.url, mediaPath);
      
      // If it's an image, resize to vertical format
      if (mediaItem.type === 'photo') {
        await sharp(mediaPath)
          .resize(1080, 1920, { fit: 'cover' })
          .toFile(path.join(tempDir, `media_${i}_resized.jpg`));
        mediaFiles.push({
          path: path.join(tempDir, `media_${i}_resized.jpg`),
          type: 'photo',
          duration: duration / media.length,
        });
      } else {
        mediaFiles.push({
          path: mediaPath,
          type: 'video',
          duration: mediaItem.duration || duration / media.length,
        });
      }
    }
    
    // Save audio
    const audioBuffer = Buffer.from(audio.split(',')[1], 'base64');
    const audioPath = path.join(tempDir, 'audio.mp3');
    await fs.writeFile(audioPath, audioBuffer);
    
    // Create text overlay frames
    const overlayDir = path.join(tempDir, 'overlays');
    await fs.mkdir(overlayDir, { recursive: true });
    await createTextOverlayFrames(script, duration, overlayDir);
    
    // Generate video with FFmpeg
    const outputPath = path.join(tempDir, 'output.mp4');
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add media inputs
      mediaFiles.forEach((file, index) => {
        command.input(file.path);
      });
      
      // Add audio
      command.input(audioPath);
      
      // Add overlay frames as input
      command.input(path.join(overlayDir, 'frame_%05d.png'))
        .inputOptions(['-framerate 30']);
      
      // Complex filter for combining everything
      let filterComplex = '';
      let lastOutput = '';
      
      // Create video stream from images/videos
      mediaFiles.forEach((file, index) => {
        if (file.type === 'photo') {
          filterComplex += `[${index}:v]loop=loop=${Math.floor(file.duration * 30)}:size=1,setpts=N/30/TB,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v${index}];`;
        } else {
          filterComplex += `[${index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS[v${index}];`;
        }
      });
      
      // Concatenate all video inputs
      const videoInputs = mediaFiles.map((_, i) => `[v${i}]`).join('');
      filterComplex += `${videoInputs}concat=n=${mediaFiles.length}:v=1:a=0[mainvideo];`;
      
      // Overlay text on video
      filterComplex += `[mainvideo][${mediaFiles.length + 1}:v]overlay=0:0[outv]`;
      
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-map', `${mediaFiles.length}:a`,
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('end', async () => {
          // Read the output file
          const videoBuffer = await fs.readFile(outputPath);
          const videoBase64 = videoBuffer.toString('base64');
          
          // Clean up temp files
          await fs.rm(tempDir, { recursive: true, force: true });
          
          resolve(NextResponse.json({
            video: `data:video/mp4;base64,${videoBase64}`,
            success: true,
          }));
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('Error generating video:', error);
    
    // Clean up temp files on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
    
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}