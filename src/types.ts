export interface ProposalRecord {
  tags: string[];
  stage?: number;
  name: string;
  link?: string;
  authors?: string[];
  champions?: string[];
  meeting?: string;
  tests?: string;
  rationale?: string;
}

export interface ECMAMember {
  category: string;
  href: string;
  logo: string;
  name: string;
}
