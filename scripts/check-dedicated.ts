import * as cheerio from 'cheerio';

async function checkDedicatedListPage() {
  const url = 'https://en.wikipedia.org/wiki/List_of_video_games_released_in_2026';
  console.log(`Checking ${url}...`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
  });
  console.log('Status:', res.status);
  const html = await res.text();
  const $ = cheerio.load(html);

  $('table.wikitable').each((i, table) => {
    const caption = $(table).find('caption').text().trim();
    const ths: string[] = [];
    $(table).find('tr').first().find('th').each((_, th) => {
      ths.push($(th).text().trim().replace(/\s+/g, ' '));
    });
    console.log(`\nTable #${i + 1} (${caption}):`, ths);
    const row1 = $(table).find('tr').eq(1).find('td').map((_, td) => $(td).text().trim().replace(/\s+/g, ' ')).get();
    console.log('Row 1:', row1);
  });
}

checkDedicatedListPage();
