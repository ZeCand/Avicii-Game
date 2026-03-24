export interface Song {
  id: string;
  title: string;
  previewUrl: string;
  coverUrl: string;
  artist: string;
}

export async function getAviciiSongs(): Promise<Song[]> {
  try {
    // pega as músicas do iTunes usando a API de busca, filtrando por "Avicii" e limitando a 500 resultados para garantir uma boa variedade
    const res = await fetch('https://itunes.apple.com/search?term=avicii&entity=song&limit=500');
    if (!res.ok) throw new Error('Failed to fetch from iTunes API');
    const data = await res.json();

    const songs: Song[] = [];
    const seen = new Set<string>();

    for (const track of data.results) {
      if (!track.previewUrl) continue;

      const lowerName = track.trackName.toLowerCase();
      
      // elimina versões remix, acústicas, instrumentais, etc. para focar apenas nas versões principais das músicas, que são mais reconhecíveis e relevantes para o jogo
      if (
        lowerName.includes('remix') ||
        lowerName.includes('club mix') ||
        lowerName.includes('dub mix') ||
        lowerName.includes('acoustic') ||
        lowerName.includes('instrumental')
      ) {
        continue;
      }

      // apenas inclui músicas onde o artista é claramente Avicii ou seus pseudônimos conhecidos (Tim Berg, Tom Hangs) para evitar incluir faixas de outros artistas que possam ter "Avicii" no título ou em colaborações, garantindo que o jogo se mantenha fiel ao tema central do catálogo do artista
      if (!track.artistName.toLowerCase().includes('avicii') && !track.artistName.toLowerCase().includes('tim berg')) {
        continue;
      }

      // limpa o título da música para evitar duplicatas causadas por pequenas variações no nome (como "Wake Me Up - Radio Edit" vs "Wake Me Up") e garantir que cada música seja representada apenas uma vez no jogo, aumentando a diversidade de faixas disponíveis para os jogadores
      const cleanTitle = lowerName.split('(')[0].split('-')[0].trim();

      if (!seen.has(cleanTitle)) {
        seen.add(cleanTitle);
        songs.push({
          id: track.trackId.toString(),
          title: track.trackName,
          previewUrl: track.previewUrl,
          // Get higher resolution artwork
          coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
          artist: track.artistName
        });
      }
    }

    // Sort alphabetically
    return songs.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}
