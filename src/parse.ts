import { promises as fs } from 'fs';
import _ from 'lodash';
import MarkdownIt from 'markdown-it';
import { parseHTML } from './read-html';
import { ProposalRecord } from './types';

const markdown = new MarkdownIt();

export async function readAllProposals() {
  return _.concat(
    await readProposals(['ECMA-262'], [4], 'proposals/finished-proposals.md'),
    await readProposals(['ECMA-262'], [2, 3], 'proposals/README.md'),
    await readProposals(['ECMA-262'], [1], 'proposals/stage-1-proposals.md'),
    await readProposals(['ECMA-262'], [0], 'proposals/stage-0-proposals.md'),
    await readProposals(['ECMA-262'], [-1], 'proposals/inactive-proposals.md'),
    await readProposals(['ECMA-402'], [4], 'proposals/ecma402/finished-proposals.md'),
    await readProposals(['ECMA-402'], [0], 'proposals/ecma402/stage-0-proposals.md'),
  );
}

async function readProposals(tags: string[], stages: number[], path: string) {
  const records: ProposalRecord[] = [];
  const content = await fs.readFile(path, 'utf-8');
  const parsed = parseHTML(markdown.render(content));
  let i = 0;
  for (const table of parsed) {
    for (const row of table) {
      records.push({
        tags,
        stage: stages[i],
        name: row['Proposal']?.texts.join(''),
        link: _.values(row['Proposal']?.links)[0],
        authors: row['Author']?.texts,
        champions: (row['Champion'] ?? row['Champion(s)'])?.texts,
        meeting: _.values((row['TC39 meeting notes'] ?? row['Last Presented'])?.links)[0],
        tests: _.values(row['Tests']?.links)[0],
      });
    }
    i++;
  }
  return records;
}
