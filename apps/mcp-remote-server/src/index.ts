import app from './app'
import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import OAuthProvider from '@cloudflare/workers-oauth-provider'

const DEFI_LLAMA_API = 'https://yields.llama.fi/pools'
const USER_AGENT = 'loan-app/1.0'

interface LoanPool {
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apy: number
  apyBase: number
  apyReward: number
  stablecoin: boolean
  poolMeta?: string
  riskLevel?: string
}

interface ApiResponse {
  data: any[]
}

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: 'Loan',
    version: '1.0.0'
  })

  private async makeApiRequest<T>(url: string): Promise<T | null> {
    const queryParams = new URLSearchParams({
      token: 'USDC',
      chains: 'Base,Ethereum,Avalanche'
    })

    const fullUrl = `${url}?${queryParams}`

    const headers = {
      'User-Agent': USER_AGENT,
      Accept: 'application/json'
    }

    try {
      const response = await fetch(fullUrl, { headers })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return (await response.json()) as T
    } catch (error) {
      console.error('Error making API request:', error)
      return null
    }
  }

  // Format loan pool data
  private formatLoanPool(pool: LoanPool): string {
    return [
      `Project: ${pool.project}`,
      `Chain: ${pool.chain}`,
      `Symbol: ${pool.symbol}`,
      `APY: ${pool.apy.toFixed(2)}%`,
      `Base APY: ${pool.apyBase.toFixed(2)}%`,
      `Reward APY: ${pool.apyReward.toFixed(2)}%`,
      `TVL: $${pool.tvlUsd.toLocaleString()}`,
      `Risk Level: ${pool.riskLevel || 'Unknown'}`,
      `Pool Meta: ${pool.poolMeta || 'None'}`,
      '---'
    ].join('\n')
  }

  async init() {
    // Register get-loan-pools tool
    this.server.tool(
      'get-loan-pools',
      'Get USDC loan pools from various chains',
      {
        chain: z
          .enum(['Base', 'Ethereum', 'Avalanche'])
          .describe('Chain to get loan pools from')
      },
      async ({ chain }) => {
        const apiData = await this.makeApiRequest<ApiResponse>(DEFI_LLAMA_API)

        if (!apiData) {
          return {
            content: [
              { type: 'text', text: 'Failed to retrieve loan pool data' }
            ]
          }
        }

        const filteredPools = apiData.data.filter(
          (pool: any) => pool.symbol === 'USDC' && pool.chain === chain
        )

        const formattedPools: LoanPool[] = filteredPools.map((pool: any) => {
          let riskLevel = ''
          if (pool.tvlUsd > 100000000) {
            riskLevel = 'Low Risk'
          } else if (
            pool.tvlUsd > 10000000 &&
            pool.apy >= 5 &&
            pool.apy <= 30
          ) {
            riskLevel = 'Medium Risk'
          } else if (pool.tvlUsd < 10000000 && pool.apy > 50) {
            riskLevel = 'High Risk'
          } else {
            riskLevel = 'Medium Risk'
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
          }
        })

        if (formattedPools.length === 0) {
          return {
            content: [
              { type: 'text', text: `No USDC loan pools found for ${chain}` }
            ]
          }
        }

        const sortedPools = formattedPools.sort((a, b) => b.apy - a.apy)
        const topPools = sortedPools.slice(0, 5)
        const formattedPoolsText = topPools.map((pool) =>
          this.formatLoanPool(pool)
        )
        const poolsText = `Top USDC loan pools for ${chain}:\n\n${formattedPoolsText.join('\n')}`

        return {
          content: [{ type: 'text', text: poolsText }]
        }
      }
    )

    // Register get-high-yield-pools tool
    this.server.tool(
      'get-high-yield-pools',
      'Get high yield USDC loan pools',
      {
        minApy: z.number().min(0).describe('Minimum APY percentage'),
        maxRisk: z
          .enum(['Low Risk', 'Medium Risk', 'High Risk'])
          .describe('Maximum risk level')
      },
      async ({ minApy, maxRisk }) => {
        const apiData = await this.makeApiRequest<ApiResponse>(DEFI_LLAMA_API)

        if (!apiData) {
          return {
            content: [
              { type: 'text', text: 'Failed to retrieve loan pool data' }
            ]
          }
        }

        const usdcPools = apiData.data.filter(
          (pool: any) =>
            pool.symbol === 'USDC' &&
            (pool.chain === 'Base' ||
              pool.chain === 'Ethereum' ||
              pool.chain === 'Avalanche')
        )

        const formattedPools: LoanPool[] = usdcPools.map((pool: any) => {
          let riskLevel = ''
          if (pool.tvlUsd > 100000000) {
            riskLevel = 'Low Risk'
          } else if (
            pool.tvlUsd > 10000000 &&
            pool.apy >= 5 &&
            pool.apy <= 30
          ) {
            riskLevel = 'Medium Risk'
          } else if (pool.tvlUsd < 10000000 && pool.apy > 50) {
            riskLevel = 'High Risk'
          } else {
            riskLevel = 'Medium Risk'
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
          }
        })

        const riskLevels = ['Low Risk', 'Medium Risk', 'High Risk']
        const maxRiskIndex = riskLevels.indexOf(maxRisk)

        const filteredPools = formattedPools.filter((pool) => {
          const poolRiskIndex = riskLevels.indexOf(
            pool.riskLevel || 'High Risk'
          )
          return pool.apy >= minApy && poolRiskIndex <= maxRiskIndex
        })

        if (filteredPools.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No USDC loan pools found with APY >= ${minApy}% and risk level <= ${maxRisk}`
              }
            ]
          }
        }

        const sortedPools = filteredPools.sort((a, b) => b.apy - a.apy)
        const topPools = sortedPools.slice(0, 5)
        const formattedPoolsText = topPools.map((pool) =>
          this.formatLoanPool(pool)
        )
        const poolsText = `Top high-yield USDC loan pools (APY >= ${minApy}%, Risk <= ${maxRisk}):\n\n${formattedPoolsText.join('\n')}`

        return {
          content: [{ type: 'text', text: poolsText }]
        }
      }
    )
  }
}

// Export the OAuth handler as the default
export default new OAuthProvider({
  apiRoute: '/sse',
  // @ts-ignore
  apiHandler: MyMCP.mount('/sse'),
  // @ts-ignore
  defaultHandler: app,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
  // Add CORS headers for HTTPS requests
  corsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
})
