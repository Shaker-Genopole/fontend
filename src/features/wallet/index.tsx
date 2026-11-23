import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useCurrentAccount,
  useCurrentWallet,
  useDAppKit,
} from '@mysten/dapp-kit-react'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  Rocket,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  LIVE_API,
  agreementsApi,
  authApi,
  type ApiAgreement,
  type SlaTerms,
} from '@/lib/api'
import {
  SUI_NETWORK,
  contractsDeployed,
  explorerObject,
  explorerTx,
  formatSui,
  shortAddress,
} from '@/lib/sui'
import { useSession } from '@/hooks/use-session'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageShell } from '@/components/page-shell'
import {
  acceptTx,
  execute,
  proposeTx,
  submitProofTx,
  suiBalance,
} from './chain'

const DEMO_TERMS: SlaTerms = {
  maxLatencyMs: 2000,
  latencyQuorumBp: 9500,
  minAvailabilityBp: 9500,
  maxIntervalSec: 300,
  periodMs: 120_000,
  totalPeriods: 5,
  graceMs: 60_000,
  rewardPerPeriod: 10_000_000, // 0.01 SUI
  penaltyPerPeriod: 30_000_000, // 0.03 SUI
}

const DEMO_DEPLOYMENT = {
  locations: ['icu/bed-03', 'ward-b/bed-07'],
  sensorConfig: { ecgHz: 125 },
  devices: [
    {
      deviceId: 'ecg-icu-bed-03',
      kind: 'ecg',
      expectedIntervalSec: 2,
      edgeNodeId: 'edge-icu',
    },
    {
      deviceId: 'spo2-icu-bed-03',
      kind: 'spo2',
      expectedIntervalSec: 5,
      edgeNodeId: 'edge-icu',
    },
    {
      deviceId: 'cgm-ward-b-07',
      kind: 'cgm',
      expectedIntervalSec: 60,
      edgeNodeId: 'edge-ward',
    },
  ],
}

type TxLog = { label: string; digest: string }

function errorText(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

export function WalletPage() {
  const account = useCurrentAccount()
  const wallet = useCurrentWallet()
  const { account: me, refetch } = useSession()
  const [log, setLog] = useState<TxLog[]>([])
  const record = (label: string, digest: string) =>
    setLog((l) => [{ label, digest }, ...l].slice(0, 8))

  const balance = useQuery({
    queryKey: ['balance', account?.address],
    queryFn: () => suiBalance(account!.address),
    enabled: Boolean(account),
    refetchInterval: 15_000,
  })

  return (
    <PageShell
      title='Wallet and on-chain SLAs'
      description={`Connect a Sui wallet on ${SUI_NETWORK}, link it to your account, and propose, accept or settle agreements on chain.`}
    >
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Wallet className='size-5' /> Wallet
            </CardTitle>
            <CardDescription>
              Network <Badge variant='secondary'>{SUI_NETWORK}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <ConnectButton />
            {account ? (
              <div className='space-y-1 text-sm'>
                <div>
                  <span className='text-muted-foreground'>Wallet </span>
                  <b>{wallet?.name}</b>
                </div>
                <div className='font-mono break-all'>{account.address}</div>
                <div>
                  <span className='text-muted-foreground'>Balance </span>
                  <b>{balance.data ? formatSui(balance.data) : '…'}</b>
                </div>
                {SUI_NETWORK === 'testnet' && (
                  <a
                    className='inline-flex items-center gap-1 text-sm underline underline-offset-4'
                    href={`https://faucet.sui.io/?address=${account.address}`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Get testnet SUI <ExternalLink className='size-3' />
                  </a>
                )}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                No wallet connected.
              </p>
            )}
          </CardContent>
        </Card>

        <AccountLink
          linked={me?.suiAddress}
          connected={account?.address}
          onChange={() => refetch()}
        />
      </div>

      {!LIVE_API ? (
        <Alert className='mt-4'>
          <AlertTitle>Synthetic mode</AlertTitle>
          <AlertDescription>
            Build with VITE_LIVE_API=true to use accounts and on-chain
            agreements.
          </AlertDescription>
        </Alert>
      ) : !contractsDeployed ? (
        <Alert className='mt-4'>
          <AlertTitle>Contracts not configured</AlertTitle>
          <AlertDescription>
            Set VITE_SUI_PACKAGE_ID and VITE_SUI_VERIFIER_REGISTRY_ID from
            deployment.{SUI_NETWORK}.json.
          </AlertDescription>
        </Alert>
      ) : me?.role === 'consumer' ? (
        <ProposeCard disabled={!account} onDone={record} />
      ) : me?.role === 'provider' ? (
        <ProviderCard address={account?.address} onDone={record} />
      ) : null}

      {log.length > 0 && (
        <Card className='mt-4'>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            {log.map((t) => (
              <a
                key={t.digest}
                href={explorerTx(t.digest)}
                target='_blank'
                rel='noreferrer'
                className='flex items-center gap-2 underline-offset-4 hover:underline'
              >
                <CheckCircle2 className='size-4 text-green-600' /> {t.label}
                <span className='font-mono text-muted-foreground'>
                  {shortAddress(t.digest)}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}

function AccountLink({
  linked,
  connected,
  onChange,
}: {
  linked?: string
  connected?: string
  onChange: () => void
}) {
  const dAppKit = useDAppKit()
  const link = useMutation({
    mutationFn: async () => {
      const { message } = await authApi.walletChallenge()
      const { signature } = await dAppKit.signPersonalMessage({
        message: new TextEncoder().encode(message),
      })
      return authApi.linkWallet(connected!, signature)
    },
    onSuccess: () => {
      toast.success('Wallet linked to your account')
      onChange()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const unlink = useMutation({
    mutationFn: authApi.unlinkWallet,
    onSuccess: () => {
      toast.success('Wallet unlinked')
      onChange()
    },
  })
  const matches = linked && connected && linked === connected

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldCheck className='size-5' /> Account link
        </CardTitle>
        <CardDescription>
          Sign a one-time message to prove you own the wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <div>
          <span className='text-muted-foreground'>Linked address </span>
          {linked ? (
            <span className='font-mono'>{shortAddress(linked)}</span>
          ) : (
            <b>none</b>
          )}
          {matches && <Badge className='ms-2'>connected</Badge>}
        </div>
        <div className='flex gap-2'>
          <Button
            disabled={
              !LIVE_API || !connected || Boolean(matches) || link.isPending
            }
            onClick={() => link.mutate()}
          >
            {link.isPending ? <Loader2 className='animate-spin' /> : <Link2 />}{' '}
            Link connected wallet
          </Button>
          <Button
            variant='outline'
            disabled={!linked || unlink.isPending}
            onClick={() => unlink.mutate()}
          >
            <Link2Off /> Unlink
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProposeCard({
  disabled,
  onDone,
}: {
  disabled: boolean
  onDone: (label: string, digest: string) => void
}) {
  const qc = useQueryClient()
  const providers = useQuery({
    queryKey: ['providers'],
    queryFn: authApi.providers,
  })
  const [providerId, setProviderId] = useState<string>()
  const [title, setTitle] = useState('ICU remote monitoring')
  const provider = providers.data?.find((p) => p._id === providerId)

  const propose = useMutation({
    mutationFn: async () => {
      if (!provider?.suiAddress)
        throw new Error('The provider has not linked a wallet yet')
      const res = await execute(proposeTx(DEMO_TERMS, provider.suiAddress))
      if (!res.createdAgreementId)
        throw new Error('Agreement object not found in the transaction effects')
      await agreementsApi.create({
        title,
        providerId: provider._id,
        terms: DEMO_TERMS,
        onChainId: res.createdAgreementId,
      })
      return res
    },
    onSuccess: (res) => {
      onDone('Agreement proposed', res.digest)
      toast.success('Agreement proposed on chain')
      qc.invalidateQueries({ queryKey: ['agreements'] })
    },
    onError: (err) => toast.error(errorText(err)),
  })

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Rocket className='size-5' /> Propose an agreement
        </CardTitle>
        <CardDescription>
          Escrows{' '}
          {formatSui(
            BigInt(DEMO_TERMS.rewardPerPeriod * DEMO_TERMS.totalPeriods)
          )}{' '}
          for {DEMO_TERMS.totalPeriods} periods of 2 minutes (ECG within 2 s,
          availability of 95 %).
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-3'>
        <div className='space-y-1'>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className='space-y-1'>
          <Label>Provider</Label>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a provider' />
            </SelectTrigger>
            <SelectContent>
              {providers.data?.map((p) => (
                <SelectItem key={p._id} value={p._id} disabled={!p.suiAddress}>
                  {p.organisation} {p.suiAddress ? '' : '(no wallet)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-end'>
          <Button
            className='w-full'
            disabled={disabled || !provider || propose.isPending}
            onClick={() => propose.mutate()}
          >
            {propose.isPending && <Loader2 className='animate-spin' />} Propose
            on Sui
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderCard({
  address,
  onDone,
}: {
  address?: string
  onDone: (label: string, digest: string) => void
}) {
  const qc = useQueryClient()
  const agreements = useQuery({
    queryKey: ['agreements'],
    queryFn: agreementsApi.list,
    refetchInterval: 20_000,
  })
  const onChain = (agreements.data ?? []).filter((a) => a.onChainId)

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle>Agreements on chain</CardTitle>
        <CardDescription>
          Accept proposals by locking collateral, then submit proven periods
          from this wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {onChain.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            No on-chain agreements yet.
          </p>
        )}
        {onChain.map((a) => (
          <ProviderAgreement
            key={a._id}
            agreement={a}
            address={address}
            onDone={(label, digest) => {
              onDone(label, digest)
              qc.invalidateQueries({ queryKey: ['agreements'] })
            }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function ProviderAgreement({
  agreement,
  address,
  onDone,
}: {
  agreement: ApiAgreement
  address?: string
  onDone: (label: string, digest: string) => void
}) {
  const detail = useQuery({
    queryKey: ['agreement', agreement._id],
    queryFn: () => agreementsApi.get(agreement._id),
    enabled: agreement.status === 'active',
    refetchInterval: 20_000,
  })

  const accept = useMutation({
    mutationFn: async () => {
      const { deploymentCommitment } = await agreementsApi.registerDeployment(
        agreement._id,
        DEMO_DEPLOYMENT
      )
      const res = await execute(
        acceptTx(agreement.onChainId!, agreement.terms, deploymentCommitment)
      )
      await agreementsApi.activate(agreement._id, {
        onChainId: agreement.onChainId,
        startMs: res.startMs,
      })
      return res
    },
    onSuccess: (res) => onDone(`Accepted ${agreement.title}`, res.digest),
    onError: (err) => toast.error(errorText(err)),
  })

  const submit = useMutation({
    mutationFn: async (p: { period: number; jobId: string }) => {
      const proof = await agreementsApi.proof(p.jobId)
      if (!proof.proofHex || !proof.publicSignals)
        throw new Error('Proof bytes not available')
      return execute(
        submitProofTx(
          agreement.onChainId!,
          p.period,
          proof.publicSignals[0]!,
          proof.proofHex,
          address!
        )
      )
    },
    onSuccess: (res, p) => onDone(`Period ${p.period} settled`, res.digest),
    onError: (err) => toast.error(errorText(err)),
  })

  const ready = (detail.data?.periods ?? []).filter(
    (p) => p.status === 'proven' && p.jobId
  )

  return (
    <div className='rounded-lg border p-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <b>{agreement.title}</b>
        <Badge variant='secondary'>{agreement.status}</Badge>
        <a
          className='font-mono text-xs underline-offset-4 hover:underline'
          href={explorerObject(agreement.onChainId!)}
          target='_blank'
          rel='noreferrer'
        >
          {shortAddress(agreement.onChainId)}
        </a>
        {agreement.status === 'proposed' && (
          <Button
            size='sm'
            className='ms-auto'
            disabled={!address || accept.isPending}
            onClick={() => accept.mutate()}
          >
            {accept.isPending && <Loader2 className='animate-spin' />} Register
            deployment and accept
          </Button>
        )}
      </div>
      {ready.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {ready.map((p) => (
            <Button
              key={p.period}
              size='sm'
              variant='outline'
              disabled={!address || submit.isPending}
              onClick={() =>
                submit.mutate({ period: p.period, jobId: p.jobId! })
              }
            >
              Submit period {p.period}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
