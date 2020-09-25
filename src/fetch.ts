import { Octokit } from '@octokit/rest';
import { ReposGetResponseData, ReposListForOrgResponseData } from '@octokit/types';
import { promises as fs } from 'fs';
import _ from 'lodash';
import parseGithubURL from 'parse-github-url';
import { makeECMAMembers } from './ecma';
import { readAllProposals } from './parse';
import { ExportedProposalRecord } from './types';

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

async function getTC39Repos() {
  let repos: ReposListForOrgResponseData = [];
  let page = 0;
  while (true) {
    const { data } = await github.repos.listForOrg({ org: 'tc39', per_page: 100, page });
    repos.push(...data);
    if (data.length < 100) {
      break;
    }
    page++;
  }
  return repos;
}

async function makeProposals() {
  const repos = await getTC39Repos();
  const records: ExportedProposalRecord[] = [];
  for (const proposal of await readAllProposals()) {
    const tags = Array.from(proposal.tags);
    let data: ReposGetResponseData | ReposListForOrgResponseData[number] | undefined;
    if (proposal.link?.includes('github.com')) {
      const result = parseGithubURL(proposal.link)!;
      data = repos.find(({ owner, name }) => owner.login === result.owner && name === result.name);
      if (_.isNil(data)) {
        try {
          const response = await github.repos.get({
            owner: result.owner!,
            repo: result.name!,
          });
          data = response.data;
        } catch (error) {
          console.error('[Skip]', JSON.stringify(proposal.name), error);
          continue;
        }
      }
    }
    console.log('Added', proposal.name);
    if (data?.archived) {
      tags.push('archived');
    }
    records.push({
      tags,

      stage: proposal.stage,
      name: proposal.name,

      description: data?.description ?? undefined,
      rationale: proposal.rationale,

      link: proposal.link?.includes('/blob/master/') ? proposal.link : data?.html_url ?? proposal.link,
      meeting: proposal.meeting,
      tests: proposal.tests,
      edition: proposal.edition ? +proposal.edition : undefined,

      authors: proposal.authors,
      champions: proposal.champions,

      forks_count: data?.forks_count,
      open_issues_count: data?.open_issues_count,
      stargazers_count: data?.stargazers_count,
      subscribers_count: data?.subscribers_count,
      watchers_count: data?.watchers_count,

      created_at: data?.created_at,
      pushed_at: data?.pushed_at,
    });
  }
  return _.chain(records)
    .sortBy((record) => (record.created_at ? new Date(record.created_at) : record.stage))
    .reverse()
    .value();
}

async function main() {
  console.log('Fetch ECMA Members');
  const ecmaMembers = await makeECMAMembers();
  await fs.writeFile('dist/members-ecma.json', JSON.stringify(ecmaMembers, null, 2));

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
