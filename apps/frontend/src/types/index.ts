export interface LoanProtocol {
  chain: string
  project: string
  symbol: string
  apy: number
  apyBase: number
  apyReward: number
  tvlUsd: number
  poolMeta?: string
  riskLevel: string
  stablecoin: boolean
}
