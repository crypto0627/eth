'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import McpQuery from '@/components/loan/McpQuery'

interface LoanProtocol {
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

export default function MicroloansPage() {
  const [amount, setAmount] = useState<string>('100')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [protocols, setProtocols] = useState<LoanProtocol[]>([])
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false)

  // Fetch loan protocols data
  const fetchProtocols = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loan')
      const data = await response.json()
      console.log(data)
      if (data.status === 'success') {
        // Get top 3 protocols by APY
        setProtocols(data.data.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching loan protocols:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIRecommend = () => {
    setShowRecommendations(false)
    fetchProtocols()
    setTimeout(() => setShowRecommendations(true), 500)
  }

  const handleBorrow = (protocol: LoanProtocol) => {
    alert(`Borrowing ${amount} USDC on ${protocol.project} with ${protocol.apy.toFixed(2)}% APY`)
    // Implement actual borrowing logic here
  }

  return (
    <div className="min-h-screen bg-gray-50/10">
      {/* Header */}
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Microloans</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Borrow USDC</CardTitle>
            <CardDescription>
              Access liquidity from various DeFi protocols with competitive rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Amount (USDC)
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
                placeholder="Enter amount to borrow"
              />
            </div>

            <Button 
              onClick={handleAIRecommend} 
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Recommend Best Rates
            </Button>

            <h1 className="text-2xl font-bold mb-8">MCP Query Interface</h1>
            <McpQuery />
          </CardContent>
        </Card>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {showRecommendations && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recommended Protocols</h2>
            {protocols.map((protocol, index) => (
              <Card key={index} className={`w-full ${index === 0 ? 'border-green-500 bg-green-50/10' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{protocol.project}</CardTitle>
                    <div className="flex gap-2">
                      {index === 0 && <Badge className="bg-green-500">Best Rate</Badge>}
                      <Badge className={
                        protocol.riskLevel === "Low Risk" ? "bg-blue-500" : 
                        protocol.riskLevel === "Medium Risk" ? "bg-yellow-500" : 
                        "bg-red-500"
                      }>
                        {protocol.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{protocol.chain} - {protocol.symbol}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">APY</p>
                      <p className="text-2xl font-bold text-green-600">{protocol.apy.toFixed(2)}%</p>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>Base: {protocol.apyBase.toFixed(2)}%</span>
                        {protocol.apyReward > 0 && <span> + Reward: {protocol.apyReward.toFixed(2)}%</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value Locked</p>
                      <p className="text-lg font-semibold">${(protocol.tvlUsd / 1000000).toFixed(2)}M</p>
                    </div>
                  </div>
                  {protocol.poolMeta && (
                    <p className="mt-2 text-sm text-gray-500">{protocol.poolMeta}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleBorrow(protocol)} 
                    className="w-full"
                    variant={index === 0 ? "default" : "outline"}
                  >
                    Borrow {amount} USDC
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
