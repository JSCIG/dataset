import cheerio from 'cheerio';
import _ from 'lodash';
import fetch from 'node-fetch';
import { resolve } from 'path';
import { ECMAMember } from './types';

async function fetchMembers(category: string) {
  const response = await fetch(`https://www.ecma-international.org/memento/${category}.htm`);
  const $ = cheerio.load(await response.text());
  const elements = $('#contentstart table').first().find('tbody tr td').toArray();
  return elements.map((element): ECMAMember | undefined => {
    const $link = $('p a', element);
    if ($link.length === 0) {
      return;
    }
    return {
      category,
      name: $link.find('img').attr('alt')!.trim(),
      logo: `https://www.ecma-international.org${resolve('/', $link.find('img').attr('src')!)}`,
      href: $link.attr('href')!,
    };
  });
}

export async function makeECMAMembers() {
  const members = _.concat(
    await fetchMembers('associat'),
    await fetchMembers('ordinary'),
    await fetchMembers('sme'),
    await fetchMembers('spc'),
    await fetchMembers('nfp'),
  );
  return members.filter((member): member is ECMAMember => !_.isNil(member));
}
