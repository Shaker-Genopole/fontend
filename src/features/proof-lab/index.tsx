import { useState } from 'react'
import { contracts } from '@/data/dataset'
import {
  CheckCircle2,
  CircleDashed,
  EyeOff,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ProofStage,
  type SimulatedProof,
  type StageEvent,
  randomHex,
  runProofPipeline,
} from '@/lib/zk/simulator'
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
import { Slider } from '@/components/ui/slider'
import { PageShell } from '@/components/page-shell'

const stages: { id: ProofStage; label: string; party: string }[] = [
  { id: 'commit', label: 'Commit private witness', party: 'Edge node' },
  { id: 'witness', label: 'Compute circuit witness', party: 'Edge node' },
  { id: 'prove', label: 'Generate Groth16 proof', party: 'Prover (provider)' },
  { id: 'submit', label: 'Submit to Sui SLA contract', party: 'Provider' },
  { id: 'verify', label: 'On-chain verification', party: 'Sui validators' },
  {
    id: 'settle',
    label: 'Penalty / incentive settlement',
    party: 'Smart contract',
  },
]

const latencyContracts = contracts.filter((c) => c.metric === 'ecg-latency')

function sampleLatencies(n: number, meanS: number) {
  return Array.from({ length: n }, () => {
    const u = Math.random() + Math.random() + Math.random() - 1.5
    return Math.max(0.2, Number((meanS + u * 0.4).toFixed(2)))
  })
}

export function ProofLab() {
  const [contractId, setContractId] = useState(
    latencyContracts[0]?.id ?? 'SLA-1001'
  )
  const [threshold, setThreshold] = useState(2)
  const [quorum, setQuorum] = useState(99)
  const [meanLatency, setMeanLatency] = useState(1.2)
  const [samples, setSamples] = useState(200)
  const [events, setEvents] = useState<StageEvent[]>([])
  const [result, setResult] = useState<SimulatedProof | null>(null)
  const [running, setRunning] = useState(false)

  const [witness] = useState(() => ({
    deviceUuid: crypto.randomUUID(),
    patientPseudonym: `pt-${randomHex(4)}`,
    location: 'Building A / ICU / Bed 7',
    salt: randomHex(16),
  }))

  async function run() {
    setRunning(true)
    setEvents([])
    setResult(null)
    try {
      const proof = await runProofPipeline(
        { ...witness, measurements: sampleLatencies(samples, meanLatency) },
        {
          contractId,
          metric: 'ecg-latency',
          threshold,
          comparator: 'lte',
          quorum: quorum / 100,
        },
        (e) => setEvents((prev) => [...prev, e])
      )
      setResult(proof)
    } finally {
      setRunning(false)
    }
  }

  function reset() {
    setEvents([])
    setResult(null)
  }

  return (
    <PageShell
      title='Proof Lab — Scenario 1'
      description='SLA compliance verification. The edge node proves that ECG end-to-end latency satisfied the agreed bound for the required share of samples, without revealing the device, the patient or the deployment location to the service provider or the chain.'
    >
      <Alert>
        <EyeOff className='size-4' />
        <AlertTitle>Simulation</AlertTitle>
        <AlertDescription>
          Commitments are genuine SHA-256 digests computed in your browser;
          proof elements, timings and the Sui transaction are simulated to
          illustrate the protocol flow. Replace with snarkjs + a Sui RPC client
          to obtain real measurements.
        </AlertDescription>
      </Alert>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Public statement</CardTitle>
            <CardDescription>
              Known to provider, consumer and chain.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label>SLA contract</Label>
              <Select value={contractId} onValueChange={setContractId}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {latencyContracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} · {c.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Latency bound: ≤ {threshold.toFixed(1)} s</Label>
              <Slider
                min={0.5}
                max={4}
                step={0.1}
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Required share of compliant samples: ≥ {quorum} %</Label>
              <Slider
                min={80}
                max={100}
                step={0.5}
                value={[quorum]}
                onValueChange={([v]) => setQuorum(v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              Private witness{' '}
              <EyeOff className='size-4 text-muted-foreground' />
            </CardTitle>
            <CardDescription>Never leaves the edge node.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <dl className='space-y-2'>
              {[
                ['Device UUID', witness.deviceUuid],
                ['Patient pseudonym', witness.patientPseudonym],
                ['Location', witness.location],
                ['Salt', `${witness.salt.slice(0, 16)}…`],
              ].map(([k, v]) => (
                <div key={k} className='grid grid-cols-3 gap-2'>
                  <dt className='text-muted-foreground'>{k}</dt>
                  <dd className='col-span-2 truncate font-mono text-xs'>{v}</dd>
                </div>
              ))}
            </dl>
            <div className='space-y-2'>
              <Label>Simulated mean latency: {meanLatency.toFixed(2)} s</Label>
              <Slider
                min={0.5}
                max={3}
                step={0.05}
                value={[meanLatency]}
                onValueChange={([v]) => setMeanLatency(v)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='samples'>Number of ECG samples in window</Label>
              <Input
                id='samples'
                type='number'
                min={10}
                max={2000}
                value={samples}
                onChange={(e) =>
                  setSamples(
                    Math.max(10, Math.min(2000, Number(e.target.value) || 10))
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protocol execution</CardTitle>
            <CardDescription>Groth16 · BN254 · sui::groth16</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <ol className='space-y-3'>
              {stages.map((s) => {
                const ev = events.find((e) => e.stage === s.id)
                const isNext =
                  running && !ev && events.length === stages.indexOf(s)
                return (
                  <li key={s.id} className='flex gap-3'>
                    {ev ? (
                      <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-600' />
                    ) : isNext ? (
                      <Loader2 className='mt-0.5 size-4 shrink-0 animate-spin' />
                    ) : (
                      <CircleDashed className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                    )}
                    <div className='min-w-0 text-sm'>
                      <div
                        className={cn(
                          'font-medium',
                          !ev && 'text-muted-foreground'
                        )}
                      >
                        {ev?.label ?? s.label}
                        <span className='ms-2 text-xs font-normal text-muted-foreground'>
                          {s.party}
                        </span>
                      </div>
                      {ev && (
                        <div className='text-xs break-all text-muted-foreground'>
                          {ev.detail}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className='flex gap-2'>
              <Button onClick={run} disabled={running} className='flex-1'>
                {running ? <Loader2 className='animate-spin' /> : <Play />}
                Generate &amp; verify proof
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={reset}
                disabled={running}
              >
                <RotateCcw />
                <span className='sr-only'>Reset</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {result.satisfied ? (
                <CheckCircle2 className='size-5 text-emerald-600' />
              ) : (
                <XCircle className='size-5 text-red-600' />
              )}
              {result.satisfied
                ? 'SLA satisfied — proof accepted'
                : 'SLA violated — ok = 0'}
            </CardTitle>
            <CardDescription>
              {(result.satisfiedRatio * 100).toFixed(1)} % of samples met the
              bound (required ≥ {quorum} %). This ratio is computed inside the
              circuit and is not disclosed; only <code>ok</code> is public.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>
                What the provider and chain see
              </h4>
              <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs'>
                {JSON.stringify(result.publicSignals, null, 2)}
              </pre>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>prove {result.proveMs} ms</Badge>
                <Badge variant='secondary'>verify {result.verifyMs} ms</Badge>
                <Badge variant='secondary'>{result.sizeBytes} B</Badge>
                <Badge variant='secondary'>{result.gasSui} SUI gas</Badge>
              </div>
            </div>
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>
                Proof π (simulated elements)
              </h4>
              <pre className='max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs'>
                {JSON.stringify(result.proof, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
