'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Song } from '@/lib/itunes';
import { Play, Square, SkipForward, Search, Check, X, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

const DURATIONS = [1, 2, 4, 7, 11, 16];
const MAX_GUESSES = 6;

type Guess = {
  song: Song | null;
  skipped: boolean;
  correct: boolean;
};

export default function Game({ songs, initialTarget }: { songs: Song[], initialTarget: Song }) {
  const [targetSong, setTargetSong] = useState<Song>(initialTarget);
  const [playedIds, setPlayedIds] = useState<string[]>([initialTarget.id]);
  const [guesses, setGuesses] = useState<Guess[]>(Array(MAX_GUESSES).fill(null));
  const [guessIndex, setGuessIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<number | null>(null);

  // o tempo máximo permitido para ouvir a prévia depende do número de tentativas já feitas, aumentando a cada erro para dar mais pistas
  const maxDuration = status === 'playing' ? DURATIONS[guessIndex] : 30;

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    return songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, songs]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.currentTime >= maxDuration) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      } else {
        requestRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      requestRef.current = requestAnimationFrame(updateProgress);
    }
  };

  // limpa o requestAnimationFrame quando o componente desmontar para evitar erros ou vazamentos de memória
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleGuess = (song: Song | null) => {
    if (status !== 'playing') return;

    const isCorrect = song?.id === targetSong.id;
    const newGuesses = [...guesses];
    newGuesses[guessIndex] = { song, skipped: !song, correct: isCorrect };
    setGuesses(newGuesses);

    if (isCorrect) {
      setStatus('won');
    } else if (guessIndex === MAX_GUESSES - 1) {
      setStatus('lost');
    } else {
      setGuessIndex(guessIndex + 1);
    }

    setSearchQuery('');
    setSelectedSong(null);
    setShowDropdown(false);

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const resetGame = () => {
    let currentHistory = [...playedIds];
    
    // Se já jogou 90% ou mais do catálogo, limpa o histórico mais antigo
    // mantendo apenas os últimos 10% para não repetir imediatamente
    if (currentHistory.length >= songs.length * 0.9) {
      const keepCount = Math.max(1, Math.floor(songs.length * 0.1));
      currentHistory = currentHistory.slice(-keepCount);
    }
    
    const available = songs.filter(s => !currentHistory.includes(s.id));
    const newTarget = available[Math.floor(Math.random() * available.length)];
    
    setPlayedIds([...currentHistory, newTarget.id]);
    setTargetSong(newTarget);
    setGuesses(Array(MAX_GUESSES).fill(null));
    setGuessIndex(0);
    setStatus('playing');
    setSearchQuery('');
    setSelectedSong(null);
    setShowDropdown(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-lg mx-auto">
      <audio ref={audioRef} src={targetSong.previewUrl} preload="auto" />

      {/* Guesses Grid */}
      <div className="flex flex-col gap-2 mb-8">
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guessIndex && status === 'playing';

          let bgClass = 'bg-white/5 border border-white/10';
          let content = null;

          if (guess) {
            if (guess.skipped) {
              bgClass = 'bg-white/10 border border-white/20';
              content = <span className="text-white/50 italic">Pulou</span>;
            } else if (guess.correct) {
              bgClass = 'bg-green-500/20 border border-green-500/50 text-green-400';
              content = (
                <>
                  <span className="truncate">{guess.song?.title}</span>
                  <Check className="w-5 h-5 ml-auto flex-shrink-0" />
                </>
              );
            } else {
              bgClass = 'bg-red-500/20 border border-red-500/50 text-red-400';
              content = (
                <>
                  <span className="truncate">{guess.song?.title}</span>
                  <X className="w-5 h-5 ml-auto flex-shrink-0" />
                </>
              );
            }
          } else if (isCurrent) {
            bgClass = 'bg-white/10 border border-white/30';
          }

          return (
            <div key={i} className={`h-12 flex items-center px-4 rounded-md transition-colors ${bgClass}`}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
          {/* Allowed duration background */}
          <div
            className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-300"
            style={{ width: `${(maxDuration / 16) * 100}%` }}
          />
          {/* Playing progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white"
            style={{ width: `${(currentTime / 16) * 100}%` }}
          />
          {/* Dividers */}
          {DURATIONS.map((d, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-[#121212]"
              style={{ left: `${(d / 16) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-white/50 mt-2 font-mono">
          <span>0:00</span>
          <span>0:16</span>
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex justify-center mb-8">
        <button
          onClick={togglePlay}
          className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
      </div>

      {/* Pesquisa e Ações (Apenas durante o jogo) */}
      {status === 'playing' && (
        <div className="mt-auto relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Conhece a música? Pesquise aqui..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                setSelectedSong(null);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-white/10 border border-white/20 rounded-md pl-12 pr-4 py-4 text-white focus:outline-none focus:border-white/50 transition-colors"
            />
            {showDropdown && searchQuery && (
              <div className="absolute bottom-full left-0 w-full max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-md mb-2 z-10 shadow-2xl">
                {filteredSongs.length === 0 ? (
                  <div className="px-4 py-3 text-white/50">Nenhuma música encontrada</div>
                ) : (
                  filteredSongs.map(song => (
                    <button
                      key={song.id}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 text-white truncate border-b border-white/5 last:border-0"
                      onClick={() => {
                        setSelectedSong(song);
                        setSearchQuery(song.title);
                        setShowDropdown(false);
                      }}
                    >
                      {song.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleGuess(null)}
              className="flex-1 py-4 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Pular
            </button>
            <button
              onClick={() => handleGuess(selectedSong)}
              disabled={!selectedSong}
              className="flex-1 py-4 rounded-md bg-white hover:bg-gray-200 text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* End Game State */}
      {status !== 'playing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-auto p-6 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center text-center"
        >
          <img src={targetSong.coverUrl} alt={targetSong.title} className="w-48 h-48 rounded-md shadow-2xl mb-4 object-cover" />
          <h2 className="text-2xl font-bold text-white mb-1">{targetSong.title}</h2>
          <p className="text-white/50 mb-6">{targetSong.artist}</p>

          <h3 className={`text-xl font-bold mb-6 ${status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
            {status === 'won' ? 'Você Venceu! 🎉' : 'Você Perdeu! 😢'}
          </h3>

          <button
            onClick={resetGame}
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            Jogar Novamente
          </button>
        </motion.div>
      )}
    </div>
  );
}
