import { NextResponse } from 'next/server'

const BASE_URL = 'https://api.1inch.dev/history/v2.0/history'

export async function GET(request: Request) {
  try {
    // Extract the address and limit from the URL
    const address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

    // Construct the URL for the 1inch API
    const constructedUrl = `${BASE_URL}/${address}/events?chainId=1&limit=10`

    // Make the request to the 1inch API
    const response = await fetch(constructedUrl, {
      headers: {
        Authorization: `Bearer 21esOPPGlyWZiREGQEQE9mn8zeHLhykR` // Use API key from environment variables
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    console.log(data)
    return NextResponse.json(data.items)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    )
  }
}
