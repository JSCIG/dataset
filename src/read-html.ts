import cheerio from 'cheerio';

export function parseHTML(input: string) {
  const $ = cheerio.load(input);

  function buildHeaders(element: cheerio.Element) {
    return $('tr th', element)
      .toArray()
      .map((cell) => $(cell).text().trim());
  }

  function buildRow(row: cheerio.Element, index: number) {
    if (index === 0) {
      return [];
    }
    return $('td', row)
      .toArray()
      .map(
        (cell): Field => ({
          texts: $(cell)
            .text()
            .trim()
            .split(/<br \/>/g)
            .map((item) => item.trim()),
          links: Object.fromEntries(
            $('a', cell)
              .toArray()
              .map((element) => [$(element).text().trim(), element.attribs.href]),
          ),
        }),
      );
  }

  return $('table')
    .toArray()
    .map((element) => {
      const headers = buildHeaders(element);
      return $('tr', element)
        .toArray()
        .map(buildRow)
        .filter((records) => records.length)
        .map((records): Record<string, Field> => Object.fromEntries(records.map((record, i) => [headers[i], record])));
    });
}

interface Field {
  texts: string[];
  links: Record<string | number, string>;
}
