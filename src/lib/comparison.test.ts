import { calculateBaseTotal, rankQuotations } from "@/lib/comparison";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testRankingExcludesLandedCharges() {
  const ranked = rankQuotations([
    {
      id: "expensive-landed",
      vendorName: "A",
      baseTotal: 1000,
      leadTimeDays: 10,
      pastRating: 4,
      taxTotal: 0,
      freightCost: 0,
    },
    {
      id: "lowest-base",
      vendorName: "B",
      baseTotal: 900,
      leadTimeDays: 20,
      pastRating: 3,
      taxTotal: 4000,
      freightCost: 9000,
    },
  ]);

  assert(ranked[0].id === "lowest-base", "Expected lowest base quote to rank first");
  assert(ranked[0].rankLabel === "L1", "Expected first quote to be L1");
}

function testBaseTotalCalculation() {
  const total = calculateBaseTotal(
    [
      { quantity: 5, unitPrice: 100 },
      { quantity: 2, unitPrice: 250 },
    ],
    100,
  );

  assert(total === 900, "Expected base total to subtract discount");
}

testRankingExcludesLandedCharges();
testBaseTotalCalculation();
console.log("comparison tests passed");
