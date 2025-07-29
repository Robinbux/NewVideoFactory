'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsArticleCard from "@/components/NewsArticleCard";
import MediaSelector from "@/components/MediaSelector";
import VoiceSettingsComponent from "@/components/VoiceSettings";
import { Loader2, Search, Sparkles, Video, Download, ChevronRight, RefreshCw } from "lucide-react";

type Step = 'news' | 'script' | 'media' | 'voice' | 'generate' | 'preview';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface Script {
  hook: string;
  script: string;
  keywords: string[];
  metadata: {
    wordCount: number;
    estimatedDuration: number;
  };
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('news');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [mediaResults, setMediaResults] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [finalVideo, setFinalVideo] = useState('');

  const steps = [
    { id: 'news', label: 'Select Article', icon: Search },
    { id: 'script', label: 'Generate Script', icon: Sparkles },
    { id: 'media', label: 'Choose Media', icon: Video },
    { id: 'voice', label: 'Voice Settings', icon: Video },
    { id: 'generate', label: 'Generate Video', icon: Video },
    { id: 'preview', label: 'Preview & Export', icon: Download },
  ];

  const searchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news?query=${encodeURIComponent(searchQuery || 'finance technology')}`);
      const data = await response.json();
      setNewsArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async () => {
    if (!selectedArticle) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: selectedArticle,
          length: scriptLength,
        }),
      });
      const data = await response.json();
      setScript(data);
      
      // Auto-search for media based on keywords
      if (data.keywords && data.keywords.length > 0) {
        searchMedia(data.keywords);
      }
      
      setCurrentStep('media');
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMedia = async (keywords: string[]) => {
    setLoading(true);
    try {
      const query = keywords.slice(0, 3).join(' ');
      const response = await fetch(`/api/search-media?query=${encodeURIComponent(query)}&type=both`);
      const data = await response.json();
      setMediaResults(data);
    } catch (error) {
      console.error('Error searching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVoice = async () => {
    if (!script || !voiceId || !voiceSettings) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script.script,
          voiceId,
          voiceSettings,
        }),
      });
      const data = await response.json();
      setAudioUrl(data.audio);
      setCurrentStep('generate');
    } catch (error) {
      console.error('Error generating voice:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!script || !selectedMedia.length || !audioUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script.script,
          media: selectedMedia,
          audio: audioUrl,
          duration: script.metadata.estimatedDuration,
        }),
      });
      const data = await response.json();
      setFinalVideo(data.video);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = () => {
    if (!finalVideo) return;
    
    const link = document.createElement('a');
    link.href = finalVideo;
    link.download = `video_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI Video Generator
          </h1>
          <p className="text-muted-foreground">
            Create viral short-form videos from news articles with AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'news' && (
            <Card>
              <CardHeader>
                <CardTitle>Select a News Article</CardTitle>
                <CardDescription>
                  Search for news articles or browse the latest finance and technology news
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Search news articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchNews()}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={searchNews} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {newsArticles.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No articles found. Try searching or click below to load default articles.
                    </p>
                    <Button onClick={() => searchNews()}>
                      Load Finance & Tech News
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newsArticles.map((article, index) => (
                    <NewsArticleCard
                      key={index}
                      article={article}
                      onSelect={(article) => {
                        setSelectedArticle(article);
                        setCurrentStep('script');
                      }}
                      isSelected={selectedArticle?.url === article.url}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'script' && selectedArticle && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Video Script</CardTitle>
                <CardDescription>
                  AI will create an engaging script based on the selected article
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Selected Article</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">{selectedArticle.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedArticle.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Script Length</h3>
                    <div className="flex gap-2">
                      {(['short', 'medium', 'long'] as const).map((length) => (
                        <Button
                          key={length}
                          variant={scriptLength === length ? 'default' : 'outline'}
                          onClick={() => setScriptLength(length)}
                        >
                          {length.charAt(0).toUpperCase() + length.slice(1)}
                          <span className="ml-1 text-xs opacity-70">
                            ({length === 'short' ? '30s' : length === 'medium' ? '60s' : '90s'})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {script && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Hook</h4>
                        <p className="mt-1">{script.hook}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Script</h4>
                        <p className="mt-1 whitespace-pre-wrap">{script.script}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Keywords</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {script.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Words: {script.metadata.wordCount}</span>
                        <span>Duration: ~{script.metadata.estimatedDuration}s</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={generateScript}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : script ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Script
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Script
                        </>
                      )}
                    </Button>
                    {script && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('media')}
                      >
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'media' && mediaResults && (
            <Card>
              <CardHeader>
                <CardTitle>Select Media</CardTitle>
                <CardDescription>
                  Choose photos and videos that match your script
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaSelector
                  media={mediaResults}
                  onSelect={setSelectedMedia}
                  maxSelection={8}
                />
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('script')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('voice')}
                    disabled={selectedMedia.length === 0}
                    className="flex-1"
                  >
                    Continue ({selectedMedia.length} selected)
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'voice' && (
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>
                  Choose a voice and adjust parameters for the narration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceSettingsComponent
                  onVoiceSelect={(id, settings) => {
                    setVoiceId(id);
                    setVoiceSettings(settings);
                    generateVoice();
                  }}
                />
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('media')}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'generate' && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Video</CardTitle>
                <CardDescription>
                  Combine all elements to create your final video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8">
                    {loading ? (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Generating your video...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          This may take a few minutes
                        </p>
                      </>
                    ) : (
                      <>
                        <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Ready to generate!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Click below to create your video
                        </p>
                      </>
                    )}
                  </div>

                  {audioUrl && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Preview Audio</h4>
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('voice')}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={generateVideo}
                      disabled={loading || finalVideo !== ''}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Video...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Generate Video
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'preview' && finalVideo && (
            <Card>
              <CardHeader>
                <CardTitle>Preview & Export</CardTitle>
                <CardDescription>
                  Your video is ready! Preview and download it below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="aspect-[9/16] max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full"
                      src={finalVideo}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep('news');
                        setFinalVideo('');
                        setSelectedArticle(null);
                        setScript(null);
                        setSelectedMedia([]);
                      }}
                    >
                      Create Another
                    </Button>
                    <Button onClick={downloadVideo} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Video
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
