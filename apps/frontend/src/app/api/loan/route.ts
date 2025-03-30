import { NextResponse } from 'next/server'
import { LoanProtocol } from '@/types'

export const runtime = "edge"

export async function GET() {
  try {
    const response = await fetch('https://yields.llama.fi/pools', {
      next: { revalidate: 7200 } // Cache data for 2 hours instead of 1
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    const targetChains = ['Base', 'Ethereum', 'Avalanche'];
    const targetSymbol = 'USDC';
    
    // Create a Map for faster chain lookups
    const targetChainsSet = new Set(targetChains);

    // Optimize filtering and mapping in a single pass
    const poolsByChain = new Map<string, LoanProtocol[]>();
    targetChains.forEach(chain => poolsByChain.set(chain, []));

    // Process data in a single loop with early termination conditions
    for (const pool of data.data) {
      if (pool.symbol !== targetSymbol || !targetChainsSet.has(pool.chain)) continue;

      const formattedPool: LoanProtocol = {
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd,
        apy: pool.apy || 0,
        apyBase: pool.apyBase || 0,
        apyReward: pool.apyReward || 0,
        stablecoin: pool.stablecoin,
        poolMeta: pool.poolMeta,
        riskLevel: determineRiskLevelFast(pool.tvlUsd, pool.apy)
      };

      const chainPools = poolsByChain.get(pool.chain)!;
      chainPools.push(formattedPool);
    }
    
    // Sort each chain's pools and take top 3
    const topPools: LoanProtocol[] = [];
    poolsByChain.forEach(pools => {
      // Sort in-place for better performance
      pools.sort((a, b) => b.apy - a.apy);
      topPools.push(...pools.slice(0, 4));
    });
    
    // Final sort by APY
    topPools.sort((a, b) => b.apy - a.apy);
    
    return NextResponse.json({
      status: 'success',
      data: topPools
    });
    
  } catch (error) {
    console.error('Error fetching yield data:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch yield data',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Risk distribution
function determineRiskLevelFast(tvlUsd: number, apy: number): string {
  if (tvlUsd > 100000000) return 'Low Risk';
  if (tvlUsd < 10000000 && apy > 50) return 'High Risk';
  if (tvlUsd > 10000000 && apy >= 5 && apy <= 30) return 'Medium Risk';
  return 'Medium Risk';
}
