import { Link } from '@tanstack/react-router'
import { kpis, proofs, summary } from '@/data/dataset'
import {
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FileCheck2,
  MinusCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageShell } from '@/components/page-shell'
import { StatusBadge } from '@/components/status-badge'
import { Analytics } from './components/analytics'
import { ComplianceChart, LatencyChart } from './components/sla-charts'

export function Dashboard() {
  const stats = [
    {
      title: 'SLA compliance rate',
      value: `${summary.complianceRate} %`,
      note: 'verified / decided proofs, 14 days',
      icon: ShieldCheck,
    },
    {
      title: 'Median end-to-end latency',
      value: `${summary.medianLatencyS} s`,
      note: 'ECG pipeline, SLA bound 2 s',
      icon: Clock,
    },
    {
      title: 'Median proof generation',
      value: `${summary.medianProveMs} ms`,
      note: `verification ${summary.medianVerifyMs} ms on-chain`,
      icon: Cpu,
    },
    {
      title: 'Mean gas per verification',
      value: `${summary.meanGasSui} SUI`,
      note: 'sui::groth16 verify + settlement',
      icon: Coins,
    },
    {
      title: 'Active SLA contracts',
      value: summary.activeContracts,
      note: `${summary.breachedContracts} currently breached`,
      icon: FileCheck2,
    },
    {
      title: 'Devices online',
      value: `${summary.onlineDevices} / ${summary.totalDevices}`,
      note: 'identities hidden behind commitments',
      icon: Activity,
    },
  ]

  return (
    <PageShell
      title='SLA Verification Overview'
      description='Zero-knowledge compliance monitoring for microservice healthcare edge-cloud AIoT deployments on the Sui network.'
      actions={
        <Button asChild>
          <Link to='/proof-lab'>Run a compliance proof</Link>
        </Button>
      }
    >
      <Tabs defaultValue='overview' className='space-y-4'>
        <div className='w-full overflow-x-auto pb-2'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='kpis'>Evaluation KPIs</TabsTrigger>
            <TabsTrigger value='analytics'>Platform analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {stats.map((s) => (
              <Card key={s.title}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    {s.title}
                  </CardTitle>
                  <s.icon className='size-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{s.value}</div>
                  <p className='text-xs text-muted-foreground'>{s.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>ECG end-to-end latency (24 h)</CardTitle>
                <CardDescription>
                  Median and 95th percentile against the contractual 2-second
                  bound.
                </CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <LatencyChart />
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Recent proof verifications</CardTitle>
                <CardDescription>
                  Latest Groth16 proofs settled on Sui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-4'>
                  {proofs.slice(0, 6).map((p) => (
                    <li key={p.id} className='flex items-center gap-3'>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium'>
                          {p.id}{' '}
                          <span className='text-muted-foreground'>
                            · {p.contractId}
                          </span>
                        </p>
                        <p className='truncate font-mono text-xs text-muted-foreground'>
                          {p.circuit}
                        </p>
                      </div>
                      <span className='text-xs text-muted-foreground tabular-nums'>
                        {p.proveMs} ms
                      </span>
                      <StatusBadge value={p.result} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Daily proof outcomes (14 days)</CardTitle>
              <CardDescription>
                Rejected proofs correspond to SLA windows in which the QoS
                predicate did not hold; the contract applied the agreed penalty.
              </CardDescription>
            </CardHeader>
            <CardContent className='ps-2'>
              <ComplianceChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='kpis'>
          <Card>
            <CardHeader>
              <CardTitle>Evaluation KPIs</CardTitle>
              <CardDescription>
                Key performance indicators defined in the project methodology,
                with the current (simulated) value and the target used for
                evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead className='hidden md:table-cell'>
                        Measurement method
                      </TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className='w-10' />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.map((k) => (
                      <TableRow key={k.kpi}>
                        <TableCell className='font-medium'>{k.kpi}</TableCell>
                        <TableCell className='text-muted-foreground'>
                          {k.metric}
                        </TableCell>
                        <TableCell className='hidden whitespace-normal text-muted-foreground md:table-cell'>
                          {k.method}
                        </TableCell>
                        <TableCell className='tabular-nums'>
                          {k.value}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {k.target}
                        </TableCell>
                        <TableCell>
                          {k.met === null ? (
                            <MinusCircle className='size-4 text-muted-foreground' />
                          ) : k.met ? (
                            <CheckCircle2 className='size-4 text-emerald-600' />
                          ) : (
                            <XCircle className='size-4 text-red-600' />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <Analytics />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
