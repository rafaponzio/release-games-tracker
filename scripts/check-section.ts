import * as cheerio from 'cheerio';

async function checkGamesReleasedSection() {
  const res = await fetch('https://en.wikipedia.org/wiki/2026_in_video_games', {
    headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Look for headings and their following elements
  $('h2, h3').each((_, h) => {
    const text = $(h).text().trim();
    if (text.includes('Games released') || text.includes('releases')) {
      console.log(`\nFound section: "${text}"`);
      const nextElem = $(h).next();
      console.log('Next tag:', nextElem.prop('tagName'), 'text preview:', nextElem.text().slice(0, 150));
      // find next tables
      const tables = $(h).nextUntil('h2', 'table');
      console.log('Tables following this heading:', tables.length);
      tables.each((tIndex, table) => {
        const ths: string[] = [];
        $(table).find('tr').first().find('th').each((_, th) => {
          ths.push($(th).text().trim().replace(/\s+/g, ' '));
        });
        console.log(`Table #${tIndex + 1} headers:`, ths);
      });
    }
  });
}

checkGamesReleasedSection();
