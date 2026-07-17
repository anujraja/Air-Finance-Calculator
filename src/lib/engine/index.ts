/** Public surface of the calculation engine. */
export * from "./types";
export { canadianMonthlyRate, monthlyPayment, buildYearlySchedule, calculate } from "./mortgage";
export {
  calculatorInputSchema,
  normalizeCalculatorInput,
  DEFAULT_INPUT,
  LIMITS,
  type CalculatorInput,
} from "./schema";
export { formatCAD, formatCADWhole, formatPercent, formatSignedCAD } from "./format";
