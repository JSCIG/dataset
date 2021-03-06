import { ReposGetResponseData, ReposListForOrgResponseData } from '@octokit/types';
import _ from 'lodash';
import fetch from 'node-fetch';
import parseGithubURL from 'parse-github-url';
import { github } from './github';
import { readAllProposals } from './proposal-markdown';
import { getTC39Repos } from './repos';
import { ExportedProposalRecord } from './types';

export async function getProposals() {
  const repos = await getTC39Repos();
  const records: ExportedProposalRecord[] = [];
  for (const proposal of await readAllProposals()) {
    let data: ReposGetResponseData | ReposListForOrgResponseData[number] | undefined;
    if (proposal.link?.includes('github.com')) {
      const result = parseGithubURL(proposal.link)!;
      data = repos.find(({ owner, name }) => owner.login === result.owner && name === result.name);
      if (_.isNil(data)) {
        try {
          const response = await github.repos.get({ owner: result.owner!, repo: result.name! });
          data = response.data;
        } catch (error) {
          console.error('::error::[Skip]', proposal.link, error.message);
          continue;
        }
      }
      if (data.owner.login !== result.owner || data.name !== result.name) {
        console.error('::error::[Transferred]', proposal.link, '->', data.html_url);
      }
    }
    console.log(`Added \`${proposal.name}\``);
    let spec: string | undefined;
    if (data?.owner.login === 'tc39' && /^proposal-/.test(data.name)) {
      spec = `https://tc39.es/${data.name}/`;
      const response = await fetch(spec, { method: 'HEAD' });
      if (response.status !== 200) {
        spec = undefined;
      }
    }
    records.push({
      tags: makeTags(proposal.tags, {
        'inactive': proposal.stage === -1,
        'strawperson': proposal.stage === 0,
        'proposal': proposal.stage === 1,
        'draft': proposal.stage === 2,
        'candidate': proposal.stage === 3,
        'finished': proposal.stage === 4,
        'archived': data?.archived || proposal.link?.includes('archive.org'),
        'co-champion': _.isEqual(proposal.authors, proposal.champions),
      }),

      stage: proposal.stage,
      name: proposal.name,

      description: data?.description?.trim() ?? undefined,
      rationale: proposal.rationale,

      link: proposal.link?.includes('/blob/master/') ? proposal.link : data?.html_url ?? proposal.link,
      spec,
      tests: proposal.tests,
      meeting: proposal.meeting,
      edition: proposal.edition ? +proposal.edition : undefined,

      authors: proposal.authors,
      champions: _.isEqual(proposal.authors, proposal.champions) ? undefined : proposal.champions,

      forks_count: data?.forks_count,
      open_issues_count: data?.open_issues_count,
      stargazers_count: data?.stargazers_count,

      created_at: getCreatedAt(data?.created_at, proposal.link),
      meeting_at: getMeetingAt(proposal.meeting),
      pushed_at: data?.pushed_at ? new Date(data?.pushed_at) : undefined,
    });
  }
  return _.chain(records)
    .sortBy(({ created_at, meeting_at, stage }) => created_at ?? meeting_at ?? stage)
    .reverse()
    .value();
}

function getCreatedAt(created_at?: string, link?: string) {
  if (created_at) {
    return new Date(created_at);
  } else if (link && /archive\.org\/web\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/i.test(link)) {
    return new Date(+RegExp.$1, +RegExp.$2 - 1, +RegExp.$3, +RegExp.$4, +RegExp.$5, +RegExp.$6);
  }
  return;
}

function getMeetingAt(meeting?: string) {
  if (meeting && /\/meetings\/(\d+)\-(\d+)\/\w+\-(\d+)\.md/.test(meeting)) {
    return new Date(+RegExp.$1, +RegExp.$2 - 1, +RegExp.$3);
  }
  return;
}

function makeTags(tags: string[], flags: Record<string, boolean | undefined>) {
  return _.concat(tags, _.keys(_.pickBy(flags, (value) => value === true)));
}
