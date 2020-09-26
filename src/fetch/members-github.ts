import { github } from './github';
import { GitHubMember } from './types';

async function getMembers(org: string) {
  let members: GitHubMember[] = [];
  let page = 0;
  while (true) {
    const { data } = await github.orgs.listMembers({ org, per_page: 100, page });
    for (const member of data) {
      const { data: user } = await github.users.getByUsername({ username: member.login });
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

export const getTC39Members = () => getMembers('tc39');

export const getJSCIGMembers = () => getMembers('JSCIG');
