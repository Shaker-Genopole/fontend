import { useState } from 'react'
import { providerOffers } from '@/data/dataset'
import { shortHash } from '@/data/random'
import { type ProviderOffer } from '@/data/types'
import { CheckCircle2, EyeOff, Handshake, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { PageShell } from '@/components/page-shell'

type Constraints = {
  minStorageTb: number
  maxLatencyMs: number
  maxCostSui: number
  minAvailability: number
}

type Check = { label: string; ok: boolean; hidden: string }

function prove(offer: ProviderOffer, c: Constraints): Check[] {
  const h = offer.hidden
  return [
    {
      label: `storage ≥ ${c.minStorageTb} TB`,
      ok: h.storageTb >= c.minStorageTb,
      hidden: `${h.storageTb} TB`,
    },
    {
      label: `latency ≤ ${c.maxLatencyMs} ms`,
      ok: h.latencyMs <= c.maxLatencyMs,
      hidden: `${h.latencyMs} ms`,
    },
    {
      label: `cost ≤ ${c.maxCostSui} SUI/mo`,
      ok: h.costSuiPerMonth <= c.maxCostSui,
      hidden: `${h.costSuiPerMonth} SUI`,
    },
    {
      label: `availability ≥ ${c.minAvailability} %`,
      ok: h.availabilityPct >= c.minAvailability,
      hidden: `${h.availabilityPct} %`,
    },
  ]
}

export function Negotiation() {
  const [c, setC] = useState<Constraints>({
    minStorageTb: 10,
    maxLatencyMs: 150,
    maxCostSui: 600,
    minAvailability: 99.5,
  })
  const [requested, setRequested] = useState<Constraints | null>(null)
  const [loading, setLoading] = useState(false)
  const [reveal, setReveal] = useState(false)

  function request() {
    setLoading(true)
    setTimeout(() => {
      setRequested(c)
      setLoading(false)
    }, 900)
  }

  const sliders: {
    key: keyof Constraints
    label: string
    min: number
    max: number
    step: number
    fmt: (v: number) => string
  }[] = [
    {
      key: 'minStorageTb',
      label: 'Minimum storage',
      min: 1,
      max: 40,
      step: 1,
      fmt: (v) => `≥ ${v} TB`,
    },
    {
      key: 'maxLatencyMs',
      label: 'Maximum latency',
      min: 20,
      max: 300,
      step: 5,
      fmt: (v) => `≤ ${v} ms`,
    },
    {
      key: 'maxCostSui',
      label: 'Maximum operational cost',
      min: 50,
      max: 1000,
      step: 10,
      fmt: (v) => `≤ ${v} SUI / month`,
    },
    {
      key: 'minAvailability',
      label: 'Minimum availability',
      min: 98,
      max: 99.99,
      step: 0.01,
      fmt: (v) => `≥ ${v.toFixed(2)} %`,
    },
  ]

  return (
    <PageShell
      title='Resource Negotiation — Scenario 2'
      description='A healthcare consumer requests cloud resources under explicit constraints. Each provider answers with range proofs over committed capabilities, so the consumer learns only whether every constraint holds — not the provider’s internal infrastructure.'
    >
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Consumer constraints</CardTitle>
            <CardDescription>
              Published as the public statement of the request.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            {sliders.map((s) => (
              <div key={s.key} className='space-y-2'>
                <Label>
                  {s.label}:{' '}
                  <span className='font-normal'>{s.fmt(c[s.key])}</span>
                </Label>
                <Slider
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={[c[s.key]]}
                  onValueChange={([v]) =>
                    setC((prev) => ({ ...prev, [s.key]: v }))
                  }
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className='flex-col items-stretch gap-4'>
            <Button onClick={request} disabled={loading}>
              {loading ? <Loader2 className='animate-spin' /> : <Handshake />}
              Request ZK offers
            </Button>
            <div className='flex items-center justify-between gap-2 text-sm'>
              <Label
                htmlFor='reveal'
                className='font-normal text-muted-foreground'
              >
                Researcher view: reveal hidden values
              </Label>
              <Switch
                id='reveal'
                checked={reveal}
                onCheckedChange={setReveal}
              />
            </div>
          </CardFooter>
        </Card>

        <div className='grid gap-4 sm:grid-cols-2 lg:col-span-2'>
          {providerOffers.map((offer) => {
            const checks = requested ? prove(offer, requested) : null
            const all = checks?.every((x) => x.ok)
            return (
              <Card
                key={offer.provider}
                className={all ? 'border-emerald-500/50' : ''}
              >
                <CardHeader>
                  <CardTitle className='flex items-center justify-between gap-2'>
                    {offer.provider}
                    {checks && (
                      <Badge variant={all ? 'default' : 'secondary'}>
                        {all ? 'Eligible' : 'Not eligible'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className='space-y-0.5'>
                    <div>{offer.region}</div>
                    <div className='flex items-center gap-1 font-mono text-xs'>
                      <EyeOff className='size-3' />{' '}
                      {shortHash(offer.commitment, 8, 6)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {checks ? (
                    <ul className='space-y-2 text-sm'>
                      {checks.map((x) => (
                        <li key={x.label} className='flex items-center gap-2'>
                          {x.ok ? (
                            <CheckCircle2 className='size-4 text-emerald-600' />
                          ) : (
                            <XCircle className='size-4 text-red-600' />
                          )}
                          <span>{x.label}</span>
                          {reveal && (
                            <span className='ms-auto font-mono text-xs text-muted-foreground'>
                              {x.hidden}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Awaiting request — capabilities are committed but hidden.
                    </p>
                  )}
                </CardContent>
                {all && (
                  <CardFooter>
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={() =>
                        toast.success(
                          `Draft SLA with ${offer.provider} created`,
                          {
                            description:
                              'Simulated: sla::propose() would be called on Sui.',
                          }
                        )
                      }
                    >
                      Propose SLA
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
