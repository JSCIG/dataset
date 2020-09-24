import { Octokit } from "@octokit/rest";
import { ReposListForOrgResponseData } from "@octokit/types";
import { promises as fs } from "fs";
import proposals from "./proposals.json";

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function fetchRepositories() {
  let repos: ReposListForOrgResponseData = [];
  let page = 0;
  while (true) {
    const { data } = await github.repos.listForOrg({
      org: "tc39",
      type: "public",
      per_page: 100,
      page,
    });
    page++;
    repos = repos.concat(data);
    if (data.length !== 100) {
      break;
    }
  }
  return repos;
}

async function makeRepoList() {
  const repositories = await fetchRepositories();
  return proposals.map((proposal) => {
    const repo = repositories.find((_) => _.html_url === proposal.link);
    return {
      stage: proposal.stage,
      name: proposal.name,
      link: proposal.link,
      meeting_link: proposal.meeting_link,
      authors: proposal.authors,
      champions: proposal.champions,
      archived: repo?.archived,
      forks_count: repo?.forks_count,
      network_count: repo?.network_count,
      open_issues_count: repo?.open_issues_count,
      stargazers_count: repo?.stargazers_count,
      subscribers_count: repo?.subscribers_count,
      watchers_count: repo?.watchers_count,
      published_at: repo?.created_at,
      pushed_at: repo?.pushed_at,
      updated_at: repo?.updated_at,
    };
  });
}

async function main() {
  const repos = await makeRepoList();
  await fs.writeFile("proposals.json", JSON.stringify(repos, null, 2));
  await fs.writeFile("proposals.min.json", JSON.stringify(repos));
}

main();
