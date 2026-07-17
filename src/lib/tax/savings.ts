/**
 * Down-payment savings goal: how long to reach a target, and a monthly balance
 * projection for charting. Supports an optional annual return on savings.
 */

export interface SavingsInput {
  /** Target amount to save (e.g. a $40,000 down payment). */
  targetAmount: number;
  /** Amount already saved. */
  currentSavings: number;
  /** Planned monthly contribution. */
  monthlyContribution: number;
  /** Optional annual return on savings (%), compounded monthly. Default 0. */
  annualReturnPercent?: number;
}

export interface SavingsProjectionPoint {
  month: number;
  balance: number;
}

export interface SavingsResult {
  /** Months to reach the target, or null if never (no contribution/return). */
  monthsToGoal: number | null;
  /** Whole years and remaining months, for display. */
  years: number;
  months: number;
  /** True if the target is already met. */
  alreadyMet: boolean;
  /** Monthly balance projection up to the goal (capped for charting). */
  projection: SavingsProjectionPoint[];
  /** Contribution needed to hit the goal in a round number of years. */
  requiredMonthlyForFiveYears: number;
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Monthly contribution required to reach `remaining` in `months` at rate `r`. */
function requiredContribution(remaining: number, months: number, r: number): number {
  if (remaining <= 0) return 0;
  if (r === 0) return remaining / months;
  return (remaining * r) / (Math.pow(1 + r, months) - 1);
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const target = Math.max(input.targetAmount, 0);
  const current = Math.max(input.currentSavings, 0);
  const contribution = Math.max(input.monthlyContribution, 0);
  const r = Math.max(input.annualReturnPercent ?? 0, 0) / 100 / 12;

  const alreadyMet = current >= target;

  const MAX_MONTHS = 12 * 60; // cap projections at 60 years
  const projection: SavingsProjectionPoint[] = [{ month: 0, balance: round2(current) }];
  let balance = current;
  let monthsToGoal: number | null = alreadyMet ? 0 : null;

  if (!alreadyMet) {
    for (let m = 1; m <= MAX_MONTHS; m++) {
      balance = balance * (1 + r) + contribution;
      projection.push({ month: m, balance: round2(balance) });
      if (balance >= target) {
        monthsToGoal = m;
        break;
      }
      // No progress possible → bail out as "never".
      if (contribution === 0 && r === 0) break;
    }
  }

  const years = monthsToGoal !== null ? Math.floor(monthsToGoal / 12) : 0;
  const months = monthsToGoal !== null ? monthsToGoal % 12 : 0;

  return {
    monthsToGoal,
    years,
    months,
    alreadyMet,
    projection,
    requiredMonthlyForFiveYears: round2(requiredContribution(Math.max(target - current, 0), 60, r)),
  };
}
