import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiGrpcClient } from '@mysten/sui/grpc'

type Network = 'testnet' | 'devnet' | 'mainnet' | 'localnet'

const FULLNODES: Record<Network, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
}

/** The console targets one network at a time; testnet by default. */
export const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK ??
  'testnet') as Network

/** IDs written by contracts/scripts/deploy.sh (deployment.<network>.json). */
export const ZK_SLA = {
  packageId: (import.meta.env.VITE_SUI_PACKAGE_ID as string | undefined) ?? '',
  registryId:
    (import.meta.env.VITE_SUI_VERIFIER_REGISTRY_ID as string | undefined) ?? '',
}

export const contractsDeployed = Boolean(ZK_SLA.packageId && ZK_SLA.registryId)

export const dAppKit = createDAppKit({
  networks: [SUI_NETWORK],
  defaultNetwork: SUI_NETWORK,
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: FULLNODES[network as Network] }),
  // A throwaway in-browser wallet for local development only.
  enableBurnerWallet: import.meta.env.DEV,
})

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}

export const MIST_PER_SUI = 1_000_000_000n

export const formatSui = (mist: string | bigint) => {
  const v = BigInt(mist)
  const whole = v / MIST_PER_SUI
  const frac = (v % MIST_PER_SUI).toString().padStart(9, '0').slice(0, 4)
  return `${whole}.${frac} SUI`
}

export const shortAddress = (a?: string | null) =>
  a ? `${a.slice(0, 8)}…${a.slice(-6)}` : ''

export const explorerTx = (digest: string) =>
  `https://suiscan.xyz/${SUI_NETWORK}/tx/${digest}`
export const explorerObject = (id: string) =>
  `https://suiscan.xyz/${SUI_NETWORK}/object/${id}`
