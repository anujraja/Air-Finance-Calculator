/**
 * Input validation and normalization for the calculator.
 *
 * A single Zod schema is shared by the client form and the serverless API
 * route, so validation rules can never drift between the two. The schema
 * enforces safe numeric bounds (rejecting negatives, NaN, and unrealistic
 * magnitudes) and a cross-field rule that the down payment cannot exceed the
 * home price.
 */

import { z } from "zod";
import type { EngineInput } from "./types";

/** Upper bounds chosen to reject obviously unrealistic input while staying permissive. */
export const LIMITS = {
  homePrice: { min: 1, max: 100_000_000 },
  interestRate: { min: 0, max: 25 },
  amortizationYears: { min: 1, max: 40 },
  downPaymentPercent: { min: 0, max: 100 },
  /** Generic non-negative dollar cap for recurring costs. */
  costMax: 10_000_000,
} as const;

/** A finite number field with a friendly message when the value is missing/NaN. */
const numberField = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .refine((v) => Number.isFinite(v), { message: `${label} must be a valid number.` });

/** Raw, user-facing input as it arrives from the form or API request body. */
export const calculatorInputSchema = z
  .object({
    homePrice: numberField("Home price")
      .min(LIMITS.homePrice.min, "Home price must be greater than 0.")
      .max(LIMITS.homePrice.max, "Home price is unrealistically large."),
    downPaymentType: z.enum(["dollar", "percent"]),
    downPaymentValue: numberField("Down payment").min(0, "Down payment cannot be negative."),
    annualInterestRatePercent: numberField("Interest rate")
      .min(LIMITS.interestRate.min, "Interest rate cannot be negative.")
      .max(LIMITS.interestRate.max, "Interest rate is unrealistically high."),
    amortizationYears: numberField("Amortization")
      .int("Amortization must be a whole number of years.")
      .min(LIMITS.amortizationYears.min, "Amortization must be at least 1 year.")
      .max(LIMITS.amortizationYears.max, "Amortization cannot exceed 40 years."),
    annualPropertyTax: numberField("Property tax")
      .min(0, "Property tax cannot be negative.")
      .max(LIMITS.costMax, "Property tax is unrealistically large."),
    annualHomeInsurance: numberField("Home insurance")
      .min(0, "Home insurance cannot be negative.")
      .max(LIMITS.costMax, "Home insurance is unrealistically large."),
    monthlyUtilities: numberField("Utilities")
      .min(0, "Utilities cannot be negative.")
      .max(LIMITS.costMax, "Utilities is unrealistically large."),
    monthlyCondoFees: numberField("Condo/maintenance fees")
      .min(0, "Fees cannot be negative.")
      .max(LIMITS.costMax, "Fees are unrealistically large."),
  })
  .superRefine((data, ctx) => {
    if (data.downPaymentType === "percent" && data.downPaymentValue > LIMITS.downPaymentPercent.max) {
      ctx.addIssue({
        code: "custom",
        path: ["downPaymentValue"],
        message: "Down payment percentage cannot exceed 100%.",
      });
    }
    const downPaymentAmount =
      data.downPaymentType === "percent"
        ? (data.downPaymentValue / 100) * data.homePrice
        : data.downPaymentValue;
    if (downPaymentAmount > data.homePrice) {
      ctx.addIssue({
        code: "custom",
        path: ["downPaymentValue"],
        message: "Down payment cannot exceed the home price.",
      });
    }
  });

/** Validated raw input type inferred from the schema. */
export type CalculatorInput = z.infer<typeof calculatorInputSchema>;

/**
 * Resolve the down payment (dollar or percent) into a concrete dollar amount
 * and produce the normalized {@link EngineInput} the math functions consume.
 */
export function normalizeCalculatorInput(input: CalculatorInput): EngineInput {
  const downPaymentAmount =
    input.downPaymentType === "percent"
      ? (input.downPaymentValue / 100) * input.homePrice
      : input.downPaymentValue;

  return {
    homePrice: input.homePrice,
    downPaymentAmount,
    annualInterestRatePercent: input.annualInterestRatePercent,
    amortizationYears: input.amortizationYears,
    annualPropertyTax: input.annualPropertyTax,
    annualHomeInsurance: input.annualHomeInsurance,
    monthlyUtilities: input.monthlyUtilities,
    monthlyCondoFees: input.monthlyCondoFees,
  };
}

/** Sensible, clearly-stated defaults for a first-time visitor (not advice). */
export const DEFAULT_INPUT: CalculatorInput = {
  homePrice: 650_000,
  downPaymentType: "percent",
  downPaymentValue: 20,
  annualInterestRatePercent: 5.25,
  amortizationYears: 25,
  annualPropertyTax: 4_200,
  annualHomeInsurance: 1_500,
  monthlyUtilities: 250,
  monthlyCondoFees: 0,
};
