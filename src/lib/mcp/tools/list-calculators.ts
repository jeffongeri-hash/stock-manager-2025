import { defineTool } from "@lovable.dev/mcp-js";

const CALCULATORS = [
  { name: "Coast FIRE Tracker", path: "/coast-fire-tracker", description: "Track progress toward Coast FIRE with milestone chart." },
  { name: "Coast FIRE Calculator", path: "/coast-fire-calculator", description: "Calculate your Coast FIRE number by age." },
  { name: "Early Retirement Calculator", path: "/early-retirement-calculator", description: "Project when you can retire early." },
  { name: "Financial Independence Calculator", path: "/financial-independence-calculator", description: "Determine your FI number and timeline." },
  { name: "Monthly Dividend Calculator", path: "/monthly-dividend-calculator", description: "Estimate monthly dividend income needs." },
  { name: "Covered Call Calculator", path: "/covered-call-calculator", description: "Model covered call option income." },
  { name: "Paycheck Calculator", path: "/paycheck-calculator", description: "Break down paycheck taxes and deductions." },
  { name: "Dividend Tracker", path: "/dividend-tracker", description: "Track dividend portfolio, YOC, and CAGR." },
];

export default defineTool({
  name: "list_calculators",
  title: "List Profit Pathfinder calculators",
  description: "List the financial calculators and tools available on Profit Pathfinder, with their URLs and descriptions.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: CALCULATORS.map((c) => `• ${c.name} — ${c.description} (https://profitpathfinder.online${c.path})`).join("\n"),
      },
    ],
    structuredContent: { calculators: CALCULATORS },
  }),
});
