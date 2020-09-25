export interface ProposalRecord {
  tags: string[];
  stage?: number;
  name?: string;
  link?: string;
  authors?: string[];
  champions?: string[];
  meeting?: string;
  tests?: string;
  rationale?: string;
  edition?: number;
}

export interface ExportedProposalRecord {
  tags: string[];

  stage?: number;
  name?: string;

  description?: string;
  rationale?: string;

  link?: string;
  meeting?: string;
  tests?: string;
  edition?: number;

  authors?: string[];
  champions?: string[];

  forks_count?: number;
  open_issues_count?: number;
  stargazers_count?: number;
  subscribers_count?: number;
  watchers_count?: number;

  published_at?: string;
  pushed_at?: string;
  updated_at?: string;
}

export interface ECMAMember {
  category: string;
  href: string;
  logo: string;
  name: string;
}
