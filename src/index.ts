import { promises as fs } from 'fs';
import { getRateLimit } from './fetch/github';
import { getECMAMembers } from './fetch/members-ecma';
import { getJSCIGMembers, getTC39Members } from './fetch/members-github';
import { getProposals } from './fetch/proposals';

async function main() {
  console.log('Rate limit');
  console.log(await getRateLimit());

  console.log('Fetch ECMA Members');
  await fs.writeFile('dist/members-ecma.json', JSON.stringify(await getECMAMembers(), null, 2));

  console.log('Fetch TC39 Members');
  await fs.writeFile('dist/members-tc39.json', JSON.stringify(await getTC39Members()));

  console.log('Fetch JSCIG Members');
  await fs.writeFile('dist/members-jscig.json', JSON.stringify(await getJSCIGMembers()));

  console.log('Fetch TC39 Proposals');
  const proposals = await getProposals();
  await fs.writeFile('dist/proposals.json', JSON.stringify(proposals));
  await fs.writeFile('dist/proposals.min.json', JSON.stringify(proposals));

  console.log('Rate limit');
  console.log(await getRateLimit());
}

main().catch((err) => {
  console.error(':error:', err);
  process.exit(1);
});
