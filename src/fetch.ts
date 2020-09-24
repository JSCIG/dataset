import { Octokit } from '@octokit/rest';
import { ReposGetResponseData } from '@octokit/types';
import { promises as fs } from 'fs';
import parseGithubURL from 'parse-github-url';
import { readAllProposals } from './parse';

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function makeProposals() {
  const items: any[] = [];
  for (const proposal of await readAllProposals()) {
    let data: ReposGetResponseData | undefined;
    if (proposal.link && proposal.link.includes('github.com')) {
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

      description: data?.description,
      rationale: proposal.rationale,

      link: data?.html_url ?? proposal.link,
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
  const proposals = await makeProposals();
  await fs.writeFile('dist/proposals.json', JSON.stringify(proposals, null, 2));
  await fs.writeFile('dist/proposals.min.json', JSON.stringify(proposals));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
