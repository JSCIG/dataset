import { Octokit } from '@octokit/rest';
import { ReposGetResponseData } from '@octokit/types';
import { promises as fs } from 'fs';
import parseGithubURL from 'parse-github-url';
import { readAllProposals } from './parse';
import _ from 'lodash';

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function makeMembers(org: string) {
  let members: any[] = [];
  let page = 0;
  while (true) {
    const { data } = await github.orgs.listMembers({ org, per_page: 100, page });
    for (const member of data) {
      const { data: user } = await github.users.getByUsername({ username: member.login });
      console.log('Added', member.login);
      members.push({
        name: user.name?.trim() ?? user.login,
        username: user.login,
        url: user.html_url,
        avatar_url: user.avatar_url,
        company: user.company?.trim() ?? undefined,
        location: user.location?.trim() ?? undefined,
        bio: user.bio?.trim() ?? undefined,
      });
    }
    if (data.length < 100) {
      break;
    }
    page++;
  }
  return members;
}

async function makeProposals() {
  const items: any[] = [];
  for (const proposal of await readAllProposals()) {
    let data: ReposGetResponseData | undefined;
    if (proposal.link?.includes('github.com')) {
      const result = parseGithubURL(proposal.link)!;
      try {
        const response = await github.repos.get({
          owner: result.owner!,
          repo: result.name!,
        });
        data = response.data;
      } catch {
        // ignore not found
      }
    }
    console.log('Added', proposal.name);
    items.push({
      stage: proposal.stage,
      name: proposal.name,

      description: data?.description ?? undefined,
      rationale: proposal.rationale,

      link: /\/blob\/.+\.md$/.test(proposal.link) ? proposal.link : data?.html_url ?? proposal.link,
      meeting: proposal.meeting,
      tests: proposal.tests,

      authors: proposal.authors,
      champions: proposal.champions,

      repo: data?.name,
      owner: data?.organization?.login ?? data?.owner?.login,

      archived: data?.archived,

      forks_count: data?.forks_count,
      open_issues_count: data?.open_issues_count,
      stargazers_count: data?.stargazers_count,
      subscribers_count: data?.subscribers_count,
      watchers_count: data?.watchers_count,

      published_at: data?.created_at,
      pushed_at: data?.pushed_at,
      updated_at: data?.updated_at,
    });
  }
  items.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return items;
}

async function main() {
  console.log('Fetch TC39 Members');
  const tc39Members = await makeMembers('tc39');
  await fs.writeFile('dist/members-tc39.json', JSON.stringify(tc39Members, null, 2));

  console.log('Fetch JSCIG Members');
  const jscigMembers = await makeMembers('JSCIG');
  await fs.writeFile('dist/members-jscig.json', JSON.stringify(jscigMembers, null, 2));

  console.log('Fetch TC39 Proposals');
  const proposals = await makeProposals();
  await fs.writeFile('dist/proposals.json', JSON.stringify(proposals, null, 2));
  await fs.writeFile('dist/proposals.min.json', JSON.stringify(proposals));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
