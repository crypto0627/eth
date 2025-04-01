'use client'

import { useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { getBalance } from '@wagmi/core'
import Wallet from '@/components/wallet-connect'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownToLine, ArrowUpToLine, Repeat, Coins, Github, Twitter, DiscIcon as Discord, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TransactionHistory from "@/components/home/transaction-history"
import ChainBalance from "@/components/home/chain-balance"
import Link from 'next/link'
import { formatAddress } from '@/lib/stingify'
import { useEffect, useState } from 'react'
import { config } from '@/config/wagmi-config'

export default function Home() {
  const [usdcBalance, setUSDCBalance] = useState([])
  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false)
  const account = useAccount()
  const { disconnect } = useDisconnect()
  const { chains, switchChain } = useSwitchChain()

  // // USDC token addresses by chain ID
  // const usdcAddresses: Record<number, `0x${string}`> = {
  //   84532: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Base Sepolia
  //   11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Ethereum Sepolia
  // };

  // useEffect(() => {
  //   if (!account.address) return;
    
  //   async function fetchUSDCBalances() {
  //     const balancePromises = Object.entries(usdcAddresses).map(
  //       async ([chainId, tokenAddress]) => {
  //         try {
  //           const balance = await getBalance(config, {
  //             address: account.address as `0x${string}`,
  //             token: tokenAddress,
  //             chainId: Number(chainId) as 84532 | 11155111 | 43113 | undefined,
  //           });
            
  //           return {
  //             chainId: Number(chainId),
  //             balance,
  //           };
  //         } catch (error) {
  //           console.error(`Error fetching balance for chain ${chainId}:`, error);
  //           return {
  //             chainId: Number(chainId),
  //             balance: 'Error',
  //             symbol: 'USDC',
  //           };
  //         }
  //       }
  //     );
    
  //     const balances = await Promise.all(balancePromises);
  //     setUSDCBalance(balances as any);
  //   }
    
  //   fetchUSDCBalances();
  // }, [account.address]);

  const handleChainSwitch = (chainId: number) => {
    switchChain({ chainId });
    setIsChainMenuOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gray-50/10 text-black">
      {account.status === 'connected' ? 
      <div className="min-h-screen flex flex-col w-full">
        {/* Header */}
        <header className="p-4">
          <div className="container mx-auto flex justify-center items-center">
            <div className="relative">
              <Button 
                onClick={() => setIsChainMenuOpen(!isChainMenuOpen)}
                className="text-lg font-bold bg-clip-text text-black/20 flex items-center gap-2"
              >
                {account.chain?.name}
                <ChevronDown className={`h-5 w-5 transition-transform ${isChainMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {isChainMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 border border-gray-200">
                  {chains.map((chain) => (
                    <button 
                      key={chain.id} 
                      onClick={() => handleChainSwitch(chain.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      {chain.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto p-4 space-y-6">
          {/* Balance Section */}
          <section className="space-y-2">
            <Badge variant="outline" className="px-3 text-xs text-black/20">
              {formatAddress(account.address)}
            </Badge>
            <h2 className="text-lg font-medium">Wallet (USDC)</h2>
            <Card className="w-full bg-gray-50/0 border border-gray-50/10 backdrop-blur-lg">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-3xl font-bold my-3 bg-clip-text text-black/70"></p>
                  <div className="flex gap-12 mt-2 flex-row">
                    <h2 className="text-lg text-black/20">Total balance</h2>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Operations Section */}
          <section className="space-y-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" className="h-8 w-8 flex items-center justify-center bg-white border-blue-500/30 hover:bg-white text-blue-300 rounded-xl">
                  <ArrowUpToLine className="h-5 w-5" />
                </Button>
                <span>Transfer</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" className="h-8 w-8 flex items-center justify-center bg-white border-purple-500/30 hover:bg-white text-purple-300 rounded-xl">
                  <ArrowDownToLine className="h-5 w-5" />
                </Button>
                <span>Receive</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" className="h-8 w-8 flex items-center justify-center bg-white border-indigo-500/30 hover:bg-white text-indigo-300 rounded-xl">
                  <Repeat className="h-5 w-5" />
                </Button>
                <span>Swap</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Link href="/chat">
                  <Button variant="outline" className="h-8 w-8 flex items-center justify-center bg-white border-cyan-500/30 hover:bg-white text-cyan-300 rounded-xl">
                    <Coins className="h-5 w-5" />
                  </Button>
                </Link>
                <span>Chat</span>
              </div>
            </div>
          </section>

          {/* Toggle Menu & Content */}
          <section className="space-y-4">
            <Tabs defaultValue="balance">
              <TabsList className="grid w-full grid-cols-2 bg-black/30 border border-white/10">
                <TabsTrigger value="balance" className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300">Chain Balance</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-purple-300">Transaction History</TabsTrigger>
              </TabsList>
              <TabsContent value="balance" className="mt-4">
                <ChainBalance />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
          </section>
        </main>

        {/* Footer */}
        <footer className="p-4">
          <div className="container mx-auto flex flex-col justify-center items-center gap-4">
            <Button onClick={() => disconnect()} variant="destructive" className="bg-gradient-to-r from-amber-50/80 to-amber-100/80 hover:from-amber-100 hover:to-amber-200 border border-amber-200/30 text-amber-900">Disconnect Wallet</Button>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="text-black hover:text-blue-300">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-black hover:text-indigo-300">
                <Discord className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-black hover:text-purple-300">
                <Github className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </footer>
      </div>
      : <Wallet/>}
    </div>
  )
}
