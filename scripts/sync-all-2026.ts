import { WikipediaGameScraper } from '../packages/server/src/scraper/wikipedia-scraper.js';
import { FileGameRepository } from '../packages/server/src/repository/file-game-repository.js';
import path from 'node:path';

async function syncAll2026() {
  const url = 'https://en.wikipedia.org/wiki/List_of_video_games_released_in_2026';
  console.log(`Scraping comprehensive 2026 releases from: ${url}`);

  const scraper = new WikipediaGameScraper();
  const repo = new FileGameRepository(path.join(process.cwd(), 'packages', 'server', 'data', 'games.json'));

  const games = await scraper.scrapeUrl(url, { defaultYear: 2026 });
  console.log(`Found ${games.length} total games in 2026 release schedule!`);

  const octGames = games.filter(g => g.releaseDate.month === 10 && g.releaseDate.year === 2026);
  console.log(`Found ${octGames.length} games specifically releasing in October 2026:`);
  octGames.forEach(g => {
    console.log(` - [${g.releaseDate.date || g.releaseDate.raw}] ${g.title} (${g.platforms.join(', ')})`);
  });

  const { created, updated } = await repo.bulkUpsert(games);
  console.log(`Upsert complete! Created: ${created}, Updated: ${updated}`);
}

syncAll2026().catch(console.error);
