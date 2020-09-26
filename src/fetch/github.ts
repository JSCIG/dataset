import { Octokit } from '@octokit/rest';

export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getRateLimit() {
  const { data } = await github.rateLimit.get();
  return {
    limit: data.rate.limit,
    remaining: data.rate.remaining,
    reset: new Date(data.rate.reset * 1000).toISOString(),
  };
}
