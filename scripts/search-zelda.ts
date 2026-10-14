import * as cheerio from 'cheerio';

async function searchZelda() {
  const years = [2025, 2026, 2027];
  for (const y of years) {
    const url = `https://en.wikipedia.org/wiki/List_of_video_games_released_in_${y}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'GameReleaseTracker/1.0' } });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      $('tr').each((_, tr) => {
        const text = $(tr).text();
        if (/zelda|ocarina/i.test(text)) {
          console.log(`Found Zelda match in ${y}:`, text.trim().replace(/\s+/g, ' '));
        }
      });
    } catch {}
  }

  // Also check direct Zelda Ocarina of Time Wikipedia page or rumored page
  try {
    const res = await fetch('https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Ocarina_of_Time', {
      headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('table.infobox tr').each((_, tr) => {
      const text = $(tr).text().trim().replace(/\s+/g, ' ');
      if (/release/i.test(text)) {
        console.log('Infobox release:', text);
      }
    });
  } catch {}
}

searchZelda();
