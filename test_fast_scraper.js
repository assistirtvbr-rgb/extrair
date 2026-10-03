async function inspectBingTags() {
  const query = 'site:instagram.com odontologia Belford Roxo';
  const bUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=pt-br`;
  const res = await fetch(bUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    }
  });
  const html = await res.text();
  
  // Find all links to instagram.com
  const igMatches = [...html.matchAll(/href="(https:\/\/(?:www\.)?instagram\.com\/[^"]+)"/gi)];
  console.log(`Found ${igMatches.length} raw instagram.com links in Bing HTML!`);
  const uniqueUrls = new Set();
  igMatches.forEach(m => {
    const url = m[1].replace(/&amp;/g, '&');
    if (!url.includes('/explore/') && !url.includes('/p/') && !url.includes('/reel/')) {
      uniqueUrls.add(url);
    }
  });
  console.log('Unique Instagram profiles:');
  uniqueUrls.forEach(u => console.log('  -', u));

  // Also test query for regular businesses
  const bBizUrl = `https://www.bing.com/search?q=${encodeURIComponent('odontologia Belford Roxo RJ')}&setlang=pt-br`;
  const resBiz = await fetch(bBizUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    }
  });
  const htmlBiz = await resBiz.text();
  // Find all <a target="_blank" or links with titles
  const allLinks = [...htmlBiz.matchAll(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`\nFound ${allLinks.length} total links in Bing search:`);
  allLinks.filter(l => l[2].length > 15 && !l[1].includes('bing.com') && !l[1].includes('microsoft.com')).slice(0, 10).forEach((l, i) => {
    console.log(` [${i+1}] ${l[2].replace(/<[^>]*>/g, '').trim()} -> ${l[1]}`);
  });
}

inspectBingTags();
