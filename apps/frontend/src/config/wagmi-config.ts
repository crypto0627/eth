import { http, createConfig } from '@wagmi/core'
import { baseSepolia, avalancheFuji, sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [sepolia, avalancheFuji, baseSepolia],
  transports: {
    [sepolia.id]: http(
      'https://eth-sepolia.g.alchemy.com/v2/hR5uamq-K43YZYAJldc7lpxZ2MOv0Qbk'
    ),
    [avalancheFuji.id]: http(
      'https://indulgent-multi-gas.avalanche-testnet.quiknode.pro/ecdd465081a1056ffe77dc45b6eee4ac815a41ea/ext/bc/C/rpc/'
    ),
    [baseSepolia.id]: http(
      'https://base-sepolia.g.alchemy.com/v2/hR5uamq-K43YZYAJldc7lpxZ2MOv0Qbk'
    )
  }
})
