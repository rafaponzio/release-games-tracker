import * as cheerio from 'cheerio';

async function inspectWikipedia() {
  const res = await fetch('https://en.wikipedia.org/wiki/2026_in_video_games', {
    headers: {
      'User-Agent': 'GameReleaseTracker/1.0 (+https://github.com/release-games-tracker)',
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('table.wikitable').each((i, table) => {
    console.log(`\n=== Table #${i + 1}: ${$(table).find('caption').text().trim()} ===`);
    const ths: string[] = [];
    $(table).find('tr').first().find('th').each((_, th) => {
      ths.push($(th).text().trim().replace(/\s+/g, ' '));
    });
    console.log('Headers:', ths);

    const firstRowCells: string[] = [];
    $(table).find('tr').eq(1).find('td, th').each((_, cell) => {
      firstRowCells.push($(cell).text().trim().replace(/\s+/g, ' '));
    });
    console.log('Row 1 cells:', firstRowCells);
  });
}

inspectWikipedia();
