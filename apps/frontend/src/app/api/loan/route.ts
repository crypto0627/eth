import { NextResponse } from 'next/server';

/**
 * Interface for the loan pool data returned by the API
 */
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

/**
 * Fetches yield data for USDC pools from DeFi Llama API
 * Returns the top 3 APY pools from each of Base, Ethereum, and Avalanche chains
 * Only returns pools where symbol is exactly "USDC" (not pairs like KET-USDC)
 * Also categorizes pools by risk level based on TVL and APY
 * @returns {Promise<NextResponse>} JSON response with the top USDC pools from each chain
 */
export async function GET() {
  try {
    // Fetch data from DeFi Llama API
    const response = await fetch('https://yields.llama.fi/pools');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter pools where symbol is exactly "USDC" and chain is Base, Ethereum, or Avalanche
    const filteredPools = data.data.filter((pool: any) => 
      pool.symbol === 'USDC' && 
      (pool.chain === 'Base' || pool.chain === 'Ethereum' || pool.chain === 'Avalanche')
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
    
    // Group pools by chain
    const poolsByChain: Record<string, LoanPool[]> = {
      'Base': [],
      'Ethereum': [],
      'Avalanche': []
    };
    
    formattedPools.forEach(pool => {
      if (poolsByChain[pool.chain]) {
        poolsByChain[pool.chain].push(pool);
      }
    });
    
    // Get the top 3 APY pools from each chain
    const topPools: LoanPool[] = [];
    
    for (const chain of ['Base', 'Ethereum', 'Avalanche']) {
      if (poolsByChain[chain].length > 0) {
        // Sort by APY in descending order and take the top 3
        const chainTopPools = poolsByChain[chain].sort((a, b) => b.apy - a.apy).slice(0, 3);
        topPools.push(...chainTopPools);
      }
    }
    
    // Sort the final result by APY in descending order
    const sortedPools = topPools.sort((a, b) => b.apy - a.apy);
    
    return NextResponse.json({
      status: 'success',
      data: sortedPools
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
