import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function TransactionHistory() {
  const transactions = [
    {
      id: 'tx1',
      type: 'Send',
      amount: '0.5 ETH',
      to: '0x8f3...a1b2',
      date: '2025-03-27',
      status: 'Completed'
    },
    {
      id: 'tx2',
      type: 'Receive',
      amount: '200 USDC',
      from: '0x2d4...c7e8',
      date: '2025-03-26',
      status: 'Completed'
    },
    {
      id: 'tx3',
      type: 'Swap',
      amount: '100 USDC → 0.05 ETH',
      date: '2025-03-25',
      status: 'Completed'
    },
    {
      id: 'tx4',
      type: 'Microloan',
      amount: '50 USDC',
      to: '0x9a8...f7e6',
      date: '2025-03-24',
      status: 'Pending'
    }
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{tx.type}</TableCell>
              <TableCell>{tx.amount}</TableCell>
              <TableCell className="hidden md:table-cell">{tx.date}</TableCell>
              <TableCell>
                <Badge
                  variant={tx.status === 'Completed' ? 'default' : 'outline'}
                >
                  {tx.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
