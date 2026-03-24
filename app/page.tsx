import { getAviciiSongs } from '@/lib/itunes';
import GameContainer from '@/components/GameContainer';

export default async function Page() {
  const songs = await getAviciiSongs();

  if (!songs || songs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white">
        <p>Carregando músicas ou erro na API...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white font-sans selection:bg-white/30 flex flex-col">
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col">
        <header className="flex items-center justify-center py-4 mb-6 border-b border-white/10">
          <h1 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
            <span className="text-white">◢◤</span>
            Avicii Heardle
          </h1>
        </header>
        
        <GameContainer songs={songs} />
        
        <footer className="mt-8 py-4 text-center text-white/30 text-sm">
          In Loving Memory of Tim Bergling - 1989-2018
        </footer>
      </div>
    </main>
  );
}
