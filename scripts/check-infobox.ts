import * as cheerio from 'cheerio';

async function checkInfobox(title: string, slug: string) {
  const url = `https://en.wikipedia.org/wiki/${slug}`;
  console.log(`Checking infobox for ${title}: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
    });
    if (!res.ok) {
      console.log(`Failed with status ${res.status}`);
      return;
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const infobox = $('table.infobox');
    console.log('Infobox found:', infobox.length > 0);

    infobox.find('tr').each((_, tr) => {
      const th = $(tr).find('th').text().trim();
      const td = $(tr).find('td').text().trim().replace(/\s+/g, ' ');
      if (/release/i.test(th) || /date/i.test(th)) {
        console.log(`  [Infobox Release]: "${th}" => "${td}"`);
      }
    });
  } catch (err: any) {
    console.error(`Error checking ${title}:`, err.message);
  }
}

async function main() {
  await checkInfobox('GTA VI', 'Grand_Theft_Auto_VI');
  await checkInfobox('Fable', 'Fable_(upcoming_video_game)');
}

main();
