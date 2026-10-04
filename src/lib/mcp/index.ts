import { auth, defineMcp } from "@lovable.dev/mcp-js";
import calculateCoastFireTool from "./tools/calculate-coast-fire";
import compoundGrowthTool from "./tools/compound-growth";
import listCalculatorsTool from "./tools/list-calculators";

export default defineMcp({
  name: "profit-pathfinder-mcp",
  title: "Profit Pathfinder MCP",
  version: "0.1.0",
  auth: auth.oauth.issuer({
    issuer: "https://uvqrdzwimiszqkmyzbvf.supabase.co/auth/v1",
    acceptedAudiences: "authenticated",
  }),
  instructions:
    "Tools for Profit Pathfinder, a personal-finance and FIRE planning app. Use `list_calculators` to discover available in-app tools, `calculate_coast_fire` to compute a Coast FIRE number, and `compound_growth` to project long-term investment growth.",
  tools: [calculateCoastFireTool, compoundGrowthTool, listCalculatorsTool],
});
