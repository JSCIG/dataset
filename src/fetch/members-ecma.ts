import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { resolve } from 'path';
import url from 'url';
import { ECMAMember } from './types';

function* fetchMembers(category: string, text: string): Generator<ECMAMember> {
  const $ = cheerio.load(text);
  const elements = $('#contentstart table').first().find('tbody tr td').toArray();
  for (const element of elements) {
    const $link = $('p a', element);
    if ($link.length === 0) {
      continue;
    }
    const logoPath = resolve('/', $link.find('img').attr('src')!);
    yield {
      category,
      name: $link.find('img').attr('alt')!.trim(),
      logo: `https://www.ecma-international.org${logoPath}`,
      href: normalizeURL($link.attr('href')!),
    };
  }
}

function normalizeURL(link: string) {
  const parsed = url.parse(link);
  if (parsed.path === '/' || parsed.pathname === '/') {
    parsed.path = '';
    parsed.pathname = '';
  }
  if (parsed.host && !/\.(lyten|htbox|korea|oitda|ict)\./.test(parsed.host)) {
    parsed.protocol = 'https:';
  }
  return url.format(parsed);
}

export async function getECMAMembers() {
  const members: ECMAMember[] = [];
  const categories = ['associat', 'ordinary', 'sme', 'spc', 'nfp'];
  for (const category of categories) {
    const response = await fetch(`https://www.ecma-international.org/memento/${category}.htm`);
    members.push(...fetchMembers(category, await response.text()));
  }
  return members;
}
