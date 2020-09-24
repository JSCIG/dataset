import { Octokit } from "@octokit/rest";
import { ReposGetResponseData } from "@octokit/types";
import { promises as fs } from "fs";
import proposals from "./proposals.json";

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function makeProposals() {
  const items: any[] = [];
  for (const proposal of proposals) {
    let data: ReposGetResponseData | undefined;
    if (proposal.link && proposal.link.startsWith("https://github.com/")) {
      const link = proposal.link.replace("https://github.com/", "");
      const index = link.indexOf("/");
      const end = link.indexOf("/", index + 1);
      const owner = link.slice(0, index);
      const repo = link.slice(index + 1, end !== -1 ? end : undefined);
      try {
        const response = await github.repos.get({ owner, repo });
        data = response.data;
      } catch {
        // ignore not found
      }
    }
    console.log("Added", proposal.name);
    items.push({
      stage: proposal.stage,
      name: proposal.name,

      description: data?.description,

      link: proposal.link,
      meeting_link: proposal.meeting_link,
      test_link: proposal.test_link,

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
  items.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  return items;
}

async function main() {
  const proposals = await makeProposals();
  await fs.writeFile("proposals.json", JSON.stringify(proposals, null, 2));
  await fs.writeFile("proposals.min.json", JSON.stringify(proposals));
}

main();
