import * as cheerio from 'cheerio';

async function checkBody() {
  const res = await fetch('https://en.wikipedia.org/wiki/2026_in_video_games', {
    headers: { 'User-Agent': 'GameReleaseTracker/1.0' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const h2 = $('h2').filter((_, el) => $(el).text().includes('Games released in 2026'));
  console.log('Found h2:', h2.text().trim(), 'Parent:', h2.parent().prop('tagName'), h2.parent().attr('class'));

  let target = h2.parent().hasClass('mw-heading') ? h2.parent() : h2;
  console.log('Target element:', target.prop('tagName'), target.attr('class'));

  let next = target.next();
  let i = 0;
  while (next.length && i < 15) {
    console.log(`[${i}] <${next.prop('tagName')}> class="${next.attr('class') || ''}": ${next.text().slice(0, 100).replace(/\s+/g, ' ')}`);
    if (next.find('table').length > 0 || next.is('table')) {
      const table = next.is('table') ? next : next.find('table').first();
      console.log('   TABLE FOUND! Headers:', table.find('th').map((_, th) => $(th).text().trim()).get());
      console.log('   Row 1:', table.find('tr').eq(1).find('td').map((_, td) => $(td).text().trim()).get());
    }
    if (next.hasClass('mw-heading2') || (next.is('h2') && !next.text().includes('Games released in 2026'))) {
      break;
    }
    next = next.next();
    i++;
  }
}

checkBody();
