import { toNumber } from "@/lib/format";

export type QuoteRankingInput = {
  id: string;
  vendorName: string;
  baseTotal: unknown;
  leadTimeDays?: number | null;
  pastRating?: unknown;
};

export type RankedQuote<T extends QuoteRankingInput> = T & {
  comparisonValue: number;
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
  const sorted = [...quotations].sort((a, b) => {
    const priceDelta = toNumber(a.baseTotal) - toNumber(b.baseTotal);
    if (priceDelta !== 0) return priceDelta;
    return (a.leadTimeDays ?? Number.MAX_SAFE_INTEGER) -
      (b.leadTimeDays ?? Number.MAX_SAFE_INTEGER);
  });

  return sorted.map((quote, index) => ({
    ...quote,
    comparisonValue: toNumber(quote.baseTotal),
    rank: index + 1,
    rankLabel: `L${index + 1}`,
    isLowest: index === 0,
  }));
}
