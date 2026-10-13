import { WikipediaGameScraper } from '../packages/server/src/scraper/wikipedia-scraper.js';

async function main() {
  const scraper = new WikipediaGameScraper();
  console.log('Testing live scrape for 2026 in video games...');

  try {
    const url = 'https://en.wikipedia.org/wiki/2026_in_video_games';
    console.log(`Fetching from: ${url}`);
    const games = await scraper.scrapeUrl(url, { defaultYear: 2026 });
    console.log(`Successfully scraped ${games.length} games from Wikipedia!`);
    if (games.length > 0) {
      console.log('Sample scraped games:');
      console.log(JSON.stringify(games.slice(0, 3), null, 2));
    }
  } catch (err: any) {
    console.error('Error during live scrape of 2026:', err.message);

    // Also test 2025 as fallback (Wikipedia always has rich 2024/2025 lists)
    console.log('\nTrying 2025 in video games as comparison...');
    try {
      const url25 = 'https://en.wikipedia.org/wiki/2025_in_video_games';
      const games25 = await scraper.scrapeUrl(url25, { defaultYear: 2025 });
      console.log(`Successfully scraped ${games25.length} games from 2025 Wikipedia!`);
      if (games25.length > 0) {
        console.log('Sample scraped games (2025):');
        console.log(JSON.stringify(games25.slice(0, 3), null, 2));
      }
    } catch (err2: any) {
      console.error('Error during 2025 scrape:', err2.message);
    }
  }
}

main();
