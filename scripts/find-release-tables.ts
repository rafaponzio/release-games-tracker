import * as cheerio from 'cheerio';

async function findReleaseTables() {
  const res = await fetch('https://en.wikipedia.org/wiki/2026_in_video_games', {
    headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('--- 2026 Headings ---');
  $('h2, h3').each((_, h) => {
    console.log($(h).text().trim());
  });

  const res25 = await fetch('https://en.wikipedia.org/wiki/2025_in_video_games', {
    headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
  });
  const html25 = await res25.text();
  const $25 = cheerio.load(html25);

  console.log('\n--- 2025 Release Tables ---');
  $25('table.wikitable').each((i, table) => {
    const caption = $25(table).find('caption').text().trim();
    const ths: string[] = [];
    $25(table).find('tr').first().find('th').each((_, th) => {
      ths.push($25(th).text().trim().replace(/\s+/g, ' '));
    });
    if (ths.some(t => t.toLowerCase().includes('platform') || t.toLowerCase().includes('title'))) {
      console.log(`Table ${i + 1} (${caption}):`, ths);
    }
  });
}

findReleaseTables();
