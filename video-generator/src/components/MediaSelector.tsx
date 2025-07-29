'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Play, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  type: 'photo' | 'video';
  duration?: number;
  alt?: string;
  photographer?: string;
}

interface MediaSelectorProps {
  media: {
    photos: MediaItem[];
    videos: MediaItem[];
  };
  onSelect: (selectedMedia: MediaItem[]) => void;
  maxSelection?: number;
}

export default function MediaSelector({ media, onSelect, maxSelection = 5 }: MediaSelectorProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const allMedia = [...media.photos, ...media.videos];

  const toggleSelection = (item: MediaItem) => {
    const newSelection = new Set(selectedItems);
    
    if (newSelection.has(item.id)) {
      newSelection.delete(item.id);
    } else {
      if (newSelection.size < maxSelection) {
        newSelection.add(item.id);
      }
    }
    
    setSelectedItems(newSelection);
    
    // Call onSelect with the selected media items
    const selected = allMedia.filter(m => newSelection.has(m.id));
    onSelect(selected);
  };

  const isSelected = (id: string) => selectedItems.has(id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Select Media ({selectedItems.size}/{maxSelection})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedItems(new Set());
            onSelect([]);
          }}
          disabled={selectedItems.size === 0}
        >
          Clear Selection
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allMedia.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "relative cursor-pointer overflow-hidden transition-all hover:shadow-lg",
              isSelected(item.id) && "ring-2 ring-primary"
            )}
            onClick={() => toggleSelection(item)}
          >
            <div className="relative aspect-[9/16] overflow-hidden">
              <img
                src={item.thumbnail}
                alt={item.alt || 'Media thumbnail'}
                className="h-full w-full object-cover"
              />
              
              {/* Type indicator */}
              <div className="absolute top-2 left-2 rounded-full bg-black/60 p-1.5">
                {item.type === 'video' ? (
                  <Play className="h-4 w-4 text-white" fill="white" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-white" />
                )}
              </div>
              
              {/* Duration for videos */}
              {item.type === 'video' && item.duration && (
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                  {Math.floor(item.duration)}s
                </div>
              )}
              
              {/* Selection indicator */}
              {isSelected(item.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <div className="rounded-full bg-primary p-2">
                    <Check className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
            
            {item.photographer && (
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  by {item.photographer}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}