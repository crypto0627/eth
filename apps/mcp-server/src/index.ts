import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFI_LLAMA_API = "https://yields.llama.fi/pools";
const USER_AGENT = "loan-app/1.0";

// Create server instance
const server = new McpServer({
  name: "loan",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function for making API requests
async function makeApiRequest<T>(url: string): Promise<T | null> {
    const headers = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
  
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error("Error making API request:", error);
      return null;
    }
  }
  
  interface LoanPool {
    chain: string;
    project: string;
    symbol: string;
    tvlUsd: number;
    apy: number;
    apyBase: number;
    apyReward: number;
    stablecoin: boolean;
    poolMeta?: string;
    riskLevel?: string;
  }
  
  // Format loan pool data
  function formatLoanPool(pool: LoanPool): string {
    return [
      `Project: ${pool.project}`,
      `Chain: ${pool.chain}`,
      `Symbol: ${pool.symbol}`,
      `APY: ${pool.apy.toFixed(2)}%`,
      `Base APY: ${pool.apyBase.toFixed(2)}%`,
      `Reward APY: ${pool.apyReward.toFixed(2)}%`,
      `TVL: $${pool.tvlUsd.toLocaleString()}`,
      `Risk Level: ${pool.riskLevel || "Unknown"}`,
      `Pool Meta: ${pool.poolMeta || "None"}`,
      "---",
    ].join("\n");
  }
  
  interface ApiResponse {
    data: any[];
  }

  // Register loan tools
server.tool(
    "get-loan-pools",
    "Get USDC loan pools from various chains",
    {
      chain: z.enum(["Base", "Ethereum", "Avalanche", "All"]).describe("Chain to get loan pools from"),
    },
    async ({ chain }) => {
      // Fetch data from DeFi Llama API
      const apiData = await makeApiRequest<ApiResponse>(DEFI_LLAMA_API);
  
      if (!apiData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve loan pool data",
            },
          ],
        };
      }
  
      // Filter pools where symbol is exactly "USDC" and chain matches (or all chains if "All" is selected)
      const filteredPools = apiData.data.filter((pool: any) => 
        pool.symbol === 'USDC' && 
        (chain === 'All' || pool.chain === chain)
      );
      
      // Map to a more concise format with relevant information
      const formattedPools: LoanPool[] = filteredPools.map((pool: any) => {
        // Determine risk level based on TVL and APY
        let riskLevel = '';
        if (pool.tvlUsd > 100000000) { // TVL > 100M
          riskLevel = 'Low Risk';
        } else if (pool.tvlUsd > 10000000 && pool.apy >= 5 && pool.apy <= 30) { // TVL > 10M, APY between 5% and 30%
          riskLevel = 'Medium Risk';
        } else if (pool.tvlUsd < 10000000 && pool.apy > 50) { // TVL < 10M, APY > 50%
          riskLevel = 'High Risk';
        } else {
          riskLevel = 'Medium Risk'; // Default for pools that don't fit the criteria
        }
        
        return {
          chain: pool.chain,
          project: pool.project,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd,
          apy: pool.apy || 0,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          stablecoin: pool.stablecoin,
          poolMeta: pool.poolMeta,
          riskLevel: riskLevel
        };
      });
      
      if (formattedPools.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No USDC loan pools found for ${chain}`,
            },
          ],
        };
      }
  
      // Sort by APY in descending order
      const sortedPools = formattedPools.sort((a, b) => b.apy - a.apy);
      
      // Format the top pools
      const topPools = sortedPools.slice(0, 5);
      const formattedPoolsText = topPools.map(formatLoanPool);
      const poolsText = `Top USDC loan pools for ${chain === 'All' ? 'all chains' : chain}:\n\n${formattedPoolsText.join("\n")}`;
  
      return {
        content: [
          {
            type: "text",
            text: poolsText,
          },
        ],
      };
    },
  );
  
  server.tool(
    "get-high-yield-pools",
    "Get high yield USDC loan pools",
    {
      minApy: z.number().min(0).describe("Minimum APY percentage"),
      maxRisk: z.enum(["Low Risk", "Medium Risk", "High Risk"]).describe("Maximum risk level"),
    },
    async ({ minApy, maxRisk }) => {
      // Fetch data from DeFi Llama API
      const apiData = await makeApiRequest<ApiResponse>(DEFI_LLAMA_API);
  
      if (!apiData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve loan pool data",
            },
          ],
        };
      }
  
      // Filter pools where symbol is exactly "USDC"
      const usdcPools = apiData.data.filter((pool: any) => 
        pool.symbol === 'USDC' && 
        (pool.chain === 'Base' || pool.chain === 'Ethereum' || pool.chain === 'Avalanche')
      );
      
      // Map to a more concise format with relevant information
      const formattedPools: LoanPool[] = usdcPools.map((pool: any) => {
        // Determine risk level based on TVL and APY
        let riskLevel = '';
        if (pool.tvlUsd > 100000000) { // TVL > 100M
          riskLevel = 'Low Risk';
        } else if (pool.tvlUsd > 10000000 && pool.apy >= 5 && pool.apy <= 30) { // TVL > 10M, APY between 5% and 30%
          riskLevel = 'Medium Risk';
        } else if (pool.tvlUsd < 10000000 && pool.apy > 50) { // TVL < 10M, APY > 50%
          riskLevel = 'High Risk';
        } else {
          riskLevel = 'Medium Risk'; // Default for pools that don't fit the criteria
        }
        
        return {
          chain: pool.chain,
          project: pool.project,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd,
          apy: pool.apy || 0,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          stablecoin: pool.stablecoin,
          poolMeta: pool.poolMeta,
          riskLevel: riskLevel
        };
      });
      
      // Filter by minimum APY and maximum risk level
      const riskLevels = ["Low Risk", "Medium Risk", "High Risk"];
      const maxRiskIndex = riskLevels.indexOf(maxRisk);
      
      const filteredPools = formattedPools.filter(pool => {
        const poolRiskIndex = riskLevels.indexOf(pool.riskLevel || "High Risk");
        return pool.apy >= minApy && poolRiskIndex <= maxRiskIndex;
      });
      
      if (filteredPools.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No USDC loan pools found with APY >= ${minApy}% and risk level <= ${maxRisk}`,
            },
          ],
        };
      }
  
      // Sort by APY in descending order
      const sortedPools = filteredPools.sort((a, b) => b.apy - a.apy);
      
      // Format the top pools
      const topPools = sortedPools.slice(0, 5);
      const formattedPoolsText = topPools.map(formatLoanPool);
      const poolsText = `Top high-yield USDC loan pools (APY >= ${minApy}%, Risk <= ${maxRisk}):\n\n${formattedPoolsText.join("\n")}`;
  
      return {
        content: [
          {
            type: "text",
            text: poolsText,
          },
        ],
      };
    },
  );

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Loan MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });