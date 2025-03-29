import { NextResponse } from 'next/server';

/**
 * Fetches yield data for USDC pools from DeFi Llama API
 * @returns {Promise<NextResponse>} JSON response with USDC pool data
 */
export async function GET() {
  try {
    // Fetch data from DeFi Llama API
    const response = await fetch('https://yields.llama.fi/pools');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter pools where symbol contains "USDC"
    const usdcPools = data.data.filter((pool: any) => 
      pool.symbol.includes('USDC')
    );
    
    // Map to a more concise format with relevant information
    const formattedPools = usdcPools.map((pool: any) => ({
      chain: pool.chain,
      project: pool.project,
      symbol: pool.symbol,
      tvlUsd: pool.tvlUsd,
      apy: pool.apy || 0,
      apyBase: pool.apyBase || 0,
      apyReward: pool.apyReward || 0,
      stablecoin: pool.stablecoin,
      poolMeta: pool.poolMeta
    }));
    
    // Sort by APY in descending order
    const sortedPools = formattedPools.sort((a: any, b: any) => b.apy - a.apy);
    
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
