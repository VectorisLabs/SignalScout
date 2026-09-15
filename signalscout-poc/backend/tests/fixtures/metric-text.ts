import type { Evidence, Source } from "../../src/contracts";

export const approvedSources: Source[] = [
  {
    id: "src-bbb-2021-10k",
    title: "Bed Bath & Beyond Inc. 2021 Form 10-K",
    url: "https://www.sec.gov/Archives/edgar/data/886158/000088615821000009/bbby-20210227.htm",
    domain: "sec.gov",
    rightsStatus: "PUBLIC_QUOTE_APPROVED",
    publishedAt: "2021-04-21T12:00:00.000Z",
  },
  {
    id: "src-bbb-2023-8k",
    title: "Bed Bath & Beyond Inc. 2023 Form 8-K",
    url: "https://www.sec.gov/Archives/edgar/data/886158/000119312523114010/d465247d8k.htm",
    domain: "sec.gov",
    rightsStatus: "PUBLIC_QUOTE_APPROVED",
    publishedAt: "2023-04-24T12:00:00.000Z",
  },
];

export const approvedEvidence: Evidence[] = [
  {
    id: "ev-financials-a",
    sourceId: "src-bbb-2021-10k",
    publiclyAvailableAt: "2021-04-21T12:00:00.000Z",
    title: "Reported income statement metrics",
    excerpt: "For fiscal year 2020, net sales were $7.1 billion. Gross profit was $2,300 million. Operating income was $180 million. Selling, general and administrative expenses were $2,100 million. Restructuring charges were $100 million.",
    knownOutcome: false,
  },
  {
    id: "ev-financials-b",
    sourceId: "src-bbb-2021-10k",
    publiclyAvailableAt: "2021-04-21T12:00:00.000Z",
    title: "Reported balance-sheet and cash-flow metrics",
    excerpt: "For fiscal year 2020, cash and cash equivalents were $153.5 million. Operating cash flow was $268 million. Capital expenditures were $250 million. Inventory was $2,200 million. Accounts payable were $1,100 million.",
    knownOutcome: false,
  },
  {
    id: "ev-operations",
    sourceId: "src-bbb-2021-10k",
    publiclyAvailableAt: "2021-04-21T12:00:00.000Z",
    title: "Reported debt and operating footprint",
    excerpt: "For fiscal year 2020, short-term debt was $236 million. Long-term debt was $1,700 million. The company operated 953 stores and employed 37,000 employees.",
    knownOutcome: false,
  },
  {
    id: "ev-outcome",
    sourceId: "src-bbb-2023-8k",
    publiclyAvailableAt: "2023-04-24T12:00:00.000Z",
    title: "Public restructuring outcome",
    excerpt: "The company publicly disclosed the commencement of a court-supervised restructuring process.",
    knownOutcome: true,
  },
];

export const metricInputs = approvedEvidence.slice(0, 3).map((evidence) => ({
  text: evidence.excerpt,
  sourceId: evidence.sourceId,
  evidenceId: evidence.id,
  period: "FY2020",
}));
