import { toNumber } from "@/lib/format";

export type QuoteRankingInput = {
  id: string;
  vendorName: string;
  baseTotal: unknown;
  leadTimeDays?: number | null;
  pastRating?: unknown;
  technicalCompliance?: string | null;
};

export type RankedQuote<T extends QuoteRankingInput> = T & {
  comparisonValue: number;
  evaluationScore: number;
  rank: number;
  rankLabel: string;
  isLowest: boolean;
};

export function calculateBaseTotal(
  items: Array<{ quantity: unknown; unitPrice: unknown }>,
  discount: unknown = 0,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0,
  );

  return Math.max(subtotal - toNumber(discount), 0);
}

export function rankQuotations<T extends QuoteRankingInput>(
  quotations: T[],
): RankedQuote<T>[] {
  const lowestBaseTotal = Math.min(
    ...quotations.map((quote) => Math.max(toNumber(quote.baseTotal), 1)),
  );
  const shortestLeadTime = Math.min(
    ...quotations.map((quote) => Math.max(quote.leadTimeDays ?? Number.MAX_SAFE_INTEGER, 1)),
  );
  const sorted = [...quotations].sort((a, b) => {
    const priceDelta = toNumber(a.baseTotal) - toNumber(b.baseTotal);
    if (priceDelta !== 0) return priceDelta;
    return (a.leadTimeDays ?? Number.MAX_SAFE_INTEGER) -
      (b.leadTimeDays ?? Number.MAX_SAFE_INTEGER);
  });

  return sorted.map((quote, index) => ({
    ...quote,
    comparisonValue: toNumber(quote.baseTotal),
    evaluationScore: calculateEvaluationScore(quote, lowestBaseTotal, shortestLeadTime),
    rank: index + 1,
    rankLabel: `L${index + 1}`,
    isLowest: index === 0,
  }));
}

function complianceScore(value?: string | null) {
  if (value === "COMPLIANT") return 10;
  if (value === "PARTIAL") return 5;
  if (value === "NON_COMPLIANT") return 0;
  return 3;
}

function calculateEvaluationScore<T extends QuoteRankingInput>(
  quote: T,
  lowestBaseTotal: number,
  shortestLeadTime: number,
) {
  const baseTotal = Math.max(toNumber(quote.baseTotal), 1);
  const leadTime = Math.max(quote.leadTimeDays ?? Number.MAX_SAFE_INTEGER, 1);
  const priceScore = (lowestBaseTotal / baseTotal) * 50;
  const leadTimeScore = (shortestLeadTime / leadTime) * 20;
  const performanceScore = Math.min(toNumber(quote.pastRating), 5) * 4;
  return Math.round((priceScore + leadTimeScore + performanceScore + complianceScore(quote.technicalCompliance)) * 10) / 10;
}
