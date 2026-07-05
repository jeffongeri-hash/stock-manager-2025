import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "calculate_coast_fire",
  title: "Calculate Coast FIRE number",
  description:
    "Calculate the Coast FIRE number: the invested amount today that, left to grow untouched, funds retirement at the target age. Returns coast number, projected value at retirement, and annual withdrawal at the safe withdrawal rate.",
  inputSchema: {
    currentAge: z.number().int().min(0).max(100).describe("Current age of the user."),
    retirementAge: z.number().int().min(1).max(100).describe("Age at which the user plans to retire."),
    annualExpenses: z.number().positive().describe("Expected annual expenses in retirement (today's dollars)."),
    realReturnRate: z
      .number()
      .describe("Expected annual real (inflation-adjusted) return, e.g. 0.05 for 5%. Defaults to 0.05.")
      .default(0.05),
    withdrawalRate: z
      .number()
      .describe("Safe withdrawal rate, e.g. 0.04 for the 4% rule. Defaults to 0.04.")
      .default(0.04),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ currentAge, retirementAge, annualExpenses, realReturnRate, withdrawalRate }) => {
    if (retirementAge <= currentAge) {
      return {
        content: [{ type: "text", text: "retirementAge must be greater than currentAge." }],
        isError: true,
      };
    }
    const fireNumber = annualExpenses / withdrawalRate;
    const years = retirementAge - currentAge;
    const coastNumber = fireNumber / Math.pow(1 + realReturnRate, years);
    const summary =
      `FIRE number: $${fireNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n` +
      `Coast FIRE number (invest today, coast to retirement): $${coastNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n` +
      `Years of growth: ${years}\n` +
      `Assumptions: ${(realReturnRate * 100).toFixed(1)}% real return, ${(withdrawalRate * 100).toFixed(1)}% SWR.`;
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: {
        fireNumber,
        coastNumber,
        yearsToRetirement: years,
        realReturnRate,
        withdrawalRate,
      },
    };
  },
});
