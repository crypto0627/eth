import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChainBalance() {
  const chains = [
    {
      id: "ethereum",
      name: "Ethereum",
      balance: "3,125.00 USDC",
    },
    {
      id: "polygon",
      name: "Polygon",
      balance: "1,200.00 USDC",
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      balance: "375.00 USDC",
    },
    {
      id: "optimism",
      name: "Optimism",
      balance: "100.00 USDC",
    },
  ]

  return (
    <div className="space-y-4">
      {chains.map((chain) => (
        <Card key={chain.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>{chain.name}</CardTitle>
              <CardDescription className="text-right">{chain.balance}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
