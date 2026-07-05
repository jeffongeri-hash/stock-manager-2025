import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "compound_growth",
  title: "Project compound investment growth",
  description:
    "Project the future value of an investment given a starting balance, monthly contributions, annual return rate, and number of years.",
  inputSchema: {
    startingBalance: z.number().min(0).describe("Current invested balance."),
    monthlyContribution: z.number().min(0).describe("Amount contributed each month."),
    annualReturnRate: z.number().describe("Expected annual return, e.g. 0.07 for 7%."),
    years: z.number().positive().describe("Number of years to project."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ startingBalance, monthlyContribution, annualReturnRate, years }) => {
    const months = Math.round(years * 12);
    const monthlyRate = annualReturnRate / 12;
    let balance = startingBalance;
    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    const totalContributed = startingBalance + monthlyContribution * months;
    const growth = balance - totalContributed;
    return {
      content: [
        {
          type: "text",
          text:
            `Future value after ${years} years: $${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n` +
            `Total contributed: $${totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n` +
            `Investment growth: $${growth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      ],
      structuredContent: { futureValue: balance, totalContributed, growth, months },
    };
  },
});
