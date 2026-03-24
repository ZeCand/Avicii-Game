'use client';

import { useState, useMemo, useEffect } from 'react';
import { Song } from '@/lib/itunes';
import { aviciiLyrics, LyricData } from '@/lib/lyrics';
import { Search, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

const MAX_GUESSES = 6;

type Guess = {
  song: Song | null;
  skipped: boolean;
  correct: boolean;
};

export default function LyricsGame({ songs }: { songs: Song[] }) {
  const [targetLyric, setTargetLyric] = useState<LyricData | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>(Array(MAX_GUESSES).fill(null));
  const [guessIndex, setGuessIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [playedTitles, setPlayedTitles] = useState<string[]>([]);

  const startNewGame = (history: string[]) => {
    let currentHistory = [...history];
    
    // Se já jogou 90% ou mais do catálogo, limpa o histórico mais antigo
    // mantendo apenas os últimos 10% para não repetir imediatamente
    if (currentHistory.length >= aviciiLyrics.length * 0.9) {
      const keepCount = Math.max(1, Math.floor(aviciiLyrics.length * 0.1));
      currentHistory = currentHistory.slice(-keepCount);
    }
    
    const available = aviciiLyrics.filter(l => !currentHistory.includes(l.title));
    const next = available[Math.floor(Math.random() * available.length)];
    
    setPlayedTitles([...currentHistory, next.title]);
    setTargetLyric(next);
    setGuesses(Array(MAX_GUESSES).fill(null));
    setGuessIndex(0);
    setStatus('playing');
    setSearchQuery('');
    setSelectedSong(null);
    setShowDropdown(false);
  };

  useEffect(() => {
    startNewGame([]);
  }, []);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    return songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, songs]);

  if (!targetLyric) return null;

  const handleGuess = (song: Song | null) => {
    if (status !== 'playing') return;

    const isCorrect = song ? song.title.toLowerCase().includes(targetLyric.title.toLowerCase()) : false;
    
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
  };

  const resetGame = () => {
    startNewGame(playedTitles);
  };

  // encontra o objeto da música correta para mostrar detalhes no final do jogo, caso necessário
  const targetSongObj = songs.find(s => s.title.toLowerCase().includes(targetLyric.title.toLowerCase())) || songs[0];

  return (
    <div className="flex-1 flex flex-col w-full max-w-lg mx-auto">
      {/* Lyrics Display */}
      <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl min-h-[200px] flex flex-col justify-center items-center text-center gap-3">
        {targetLyric.lines.slice(0, guessIndex + 1).map((line, i) => (
          <motion.p 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-lg md:text-xl font-serif italic ${i === guessIndex ? 'text-white font-bold' : 'text-white/60'}`}
          >
            "{line}"
          </motion.p>
        ))}
        {status === 'playing' && guessIndex < MAX_GUESSES - 1 && (
          <p className="text-white/30 text-sm mt-4">+{MAX_GUESSES - guessIndex - 1} linhas ocultas</p>
        )}
      </div>

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

      {/* Pesquisa e Ações (Apenas durante o jogo) */}
      {status === 'playing' && (
        <div className="mt-auto relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Qual é a música?"
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
          {targetSongObj?.coverUrl && (
            <img src={targetSongObj.coverUrl} alt={targetSongObj.title} className="w-48 h-48 rounded-md shadow-2xl mb-4 object-cover" />
          )}
          <h2 className="text-2xl font-bold text-white mb-1">{targetLyric.title}</h2>
          <p className="text-white/50 mb-6">{targetSongObj?.artist || 'Avicii'}</p>

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
