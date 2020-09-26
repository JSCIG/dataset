import cheerio from 'cheerio';
import _ from 'lodash';
import fetch from 'node-fetch';
import { resolve } from 'path';
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
      href: $link.attr('href')!,
    };
  }
}

export async function makeECMAMembers() {
  const members: ECMAMember[] = [];
  const categories = ['associat', 'ordinary', 'sme', 'spc', 'nfp'];
  for (const category of categories) {
    const response = await fetch(`https://www.ecma-international.org/memento/${category}.htm`);
    members.push(...fetchMembers(category, await response.text()));
  }
  return members;
}
