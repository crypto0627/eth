'use client'

import { useAccount, useDisconnect } from 'wagmi'
import Wallet from '@/components/wallet-connect'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownToLine, ArrowUpToLine, Repeat, Coins, Github, Twitter, DiscIcon as Discord } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TransactionHistory from "@/components/home/transaction-history"
import ChainBalance from "@/components/home/chain-balance"
import Link from 'next/link'

export default function Home() {
  const account = useAccount()
  const {disconnect} = useDisconnect()

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gray-50/10 text-black">
      {account.status === 'connected' ? 
      <div className="min-h-screen flex flex-col w-full">
        {/* Header */}
        <header className="p-4">
          <div className="container mx-auto flex justify-center items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-black">Wallet</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto p-4 space-y-6">
          {/* Balance Section */}
          <section className="space-y-2">
            <Badge variant="outline" className="px-3 text-xs text-black/20">
              {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
            </Badge>
            <h2 className="text-lg font-medium">Your Balance</h2>
            <Card className="w-full bg-gray-50/0 border border-gray-50/10 backdrop-blur-lg">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-300">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-3xl font-bold my-3 bg-clip-text text-black/70">$12,345.67 USDC</p>
                  <div className="flex gap-12 mt-2 flex-row px-4">
                    <Button variant="ghost" size="icon">
                      <ArrowUpToLine className="h-5 w-5 text-green-400" />
                      <span>14.23%</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ArrowDownToLine className="h-5 w-5 text-red-400" />
                      <span>-14.23%</span>
                    </Button>
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
                <Link href="/microloans">
                  <Button variant="outline" className="h-8 w-8 flex items-center justify-center bg-white border-cyan-500/30 hover:bg-white text-cyan-300 rounded-xl">
                    <Coins className="h-5 w-5" />
                  </Button>
                </Link>
                <span>Microloans</span>
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
          <div className="container mx-auto flex flex-col md:flex-col justify-center items-center gap-4">
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
