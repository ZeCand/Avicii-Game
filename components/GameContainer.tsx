'use client';

import { useState, useEffect } from 'react';
import Game from './Game';
import LyricsGame from './LyricsGame';
import { Song } from '@/lib/itunes';
import { Music, AlignLeft } from 'lucide-react';

export default function GameContainer({ songs }: { songs: Song[] }) {
  const [mode, setMode] = useState<'audio' | 'lyrics'>('audio');
  const [initialAudioTarget, setInitialAudioTarget] = useState<Song | null>(null);

  useEffect(() => {
    setInitialAudioTarget(songs[Math.floor(Math.random() * songs.length)]);
  }, [songs]);

  if (!initialAudioTarget) return null;

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setMode('audio')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            mode === 'audio' 
              ? 'bg-white text-black' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Music className="w-5 h-5" />
          Áudio
        </button>
        <button
          onClick={() => setMode('lyrics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            mode === 'lyrics' 
              ? 'bg-white text-black' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <AlignLeft className="w-5 h-5" />
          Letras
        </button>
      </div>

      {mode === 'audio' ? (
        <Game songs={songs} initialTarget={initialAudioTarget} />
      ) : (
        <LyricsGame songs={songs} />
      )}
    </div>
  );
}
