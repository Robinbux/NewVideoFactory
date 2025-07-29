'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Loader2, Volume2 } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  labels: Record<string, string>;
  preview_url: string;
  category: string;
}

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

interface VoiceSettingsProps {
  onVoiceSelect: (voiceId: string, settings: VoiceSettings) => void;
}

export default function VoiceSettingsComponent({ onVoiceSelect }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [settings, setSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true,
  });

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/generate-voice');
      const data = await response.json();
      setVoices(data.voices);
      if (data.voices.length > 0) {
        setSelectedVoice(data.voices[0].id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (voice: Voice) => {
    if (playingPreview === voice.id) {
      setPlayingPreview(null);
      return;
    }

    setPlayingPreview(voice.id);
    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlayingPreview(null);
    audio.play();
  };

  const handleConfirm = () => {
    onVoiceSelect(selectedVoice, settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Voice</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voices.map((voice) => (
            <Card
              key={voice.id}
              className={`cursor-pointer transition-all ${
                selectedVoice === voice.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedVoice(voice.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{voice.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPreview(voice);
                    }}
                  >
                    {playingPreview === voice.id ? (
                      <Volume2 className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  {voice.category} • {Object.values(voice.labels).join(', ')}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Fine-tune the voice parameters for optimal results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Stability</label>
              <span className="text-sm text-muted-foreground">
                {settings.stability.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.stability]}
              onValueChange={([value]) => setSettings({ ...settings, stability: value })}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower values are more expressive, higher values are more consistent
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Clarity + Similarity</label>
              <span className="text-sm text-muted-foreground">
                {settings.similarityBoost.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.similarityBoost]}
              onValueChange={([value]) => setSettings({ ...settings, similarityBoost: value })}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values increase clarity but may reduce emotional range
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Style Exaggeration</label>
              <span className="text-sm text-muted-foreground">
                {settings.style.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.style]}
              onValueChange={([value]) => setSettings({ ...settings, style: value })}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values make the style more pronounced
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="speaker-boost"
              checked={settings.useSpeakerBoost}
              onChange={(e) => setSettings({ ...settings, useSpeakerBoost: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="speaker-boost" className="text-sm font-medium">
              Use Speaker Boost
            </label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleConfirm} className="w-full">
        Confirm Voice Settings
      </Button>
    </div>
  );
}