import { edgeEvents, edgeNodes } from '@/data/dataset'
import { Bot, Brain, Cloud, Cpu, Server, Siren } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { StatusBadge } from '@/components/status-badge'

function Meter({
  label,
  value,
  warnAt = 70,
  badAt = 85,
}: {
  label: string
  value: number
  warnAt?: number
  badAt?: number
}) {
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='tabular-nums'>{value}%</span>
      </div>
      <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
        <div
          className={cn(
            'h-full rounded-full',
            value >= badAt
              ? 'bg-red-500'
              : value >= warnAt
                ? 'bg-amber-500'
                : 'bg-primary'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

const eventIcon = { alert: Siren, agent: Bot, model: Brain } as const

const layers = [
  {
    icon: Cloud,
    title: 'Cloud layer',
    text: 'Aggregates edge data, trains large models and redeploys compressed versions. CrewAI agents orchestrate tasks; clinician intents arrive through the MCP network.',
  },
  {
    icon: Server,
    title: 'Edge layer',
    text: 'Pre-processing, quantized/distilled AI inference, emergency detection and resource-aware control (sampling, migration, power saving).',
  },
  {
    icon: Cpu,
    title: 'Device layer',
    text: 'ECG, SpO₂, temperature, glucose and camera sensors producing the QoS measurements that SLA proofs are computed over.',
  },
]

export function Infrastructure() {
  return (
    <PageShell
      title='Edge–Cloud Infrastructure'
      description='Resource state of edge servers performing low-latency inference, and the decisions taken by AI reasoning agents to preserve QoS under battery depletion, overload and device failure.'
    >
      <div className='grid gap-4 md:grid-cols-3'>
        {layers.map((l) => (
          <Card key={l.title}>
            <CardHeader className='flex flex-row items-center gap-3 space-y-0'>
              <l.icon className='size-5 text-muted-foreground' />
              <CardTitle className='text-base'>{l.title}</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {l.text}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {edgeNodes.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle className='flex items-center justify-between gap-2 font-mono text-sm'>
                {n.id}
                <StatusBadge value={n.status} />
              </CardTitle>
              <CardDescription>{n.site}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Meter label='CPU' value={n.cpuPct} />
              <Meter label='Memory' value={n.memPct} />
              <div className='flex flex-wrap gap-2 pt-1'>
                <Badge variant='secondary' className='font-mono'>
                  {n.inferenceModel}
                </Badge>
                <Badge variant='outline'>
                  {n.medianInferenceMs} ms inference
                </Badge>
                <Badge variant='outline'>{n.energyWh} Wh / h</Badge>
                <Badge variant='outline'>{n.devices} devices</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edge intelligence events</CardTitle>
          <CardDescription>
            Alerts raised by on-device models and autonomous mitigations by
            reasoning agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className='space-y-4'>
            {edgeEvents.map((e) => {
              const Icon = eventIcon[e.kind]
              return (
                <li key={e.time + e.node} className='flex gap-3'>
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border',
                      e.kind === 'alert' && 'border-red-500/40 text-red-600'
                    )}
                  >
                    <Icon className='size-4' />
                  </div>
                  <div className='text-sm'>
                    <div className='flex gap-2 text-xs text-muted-foreground'>
                      <span className='tabular-nums'>{e.time}</span>
                      <span className='font-mono'>{e.node}</span>
                    </div>
                    <p>{e.text}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>
    </PageShell>
  )
}
