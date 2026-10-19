import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { proofs, summary } from '@/data/dataset'
import { shortHash } from '@/data/random'
import { type ZkProof } from '@/data/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import { PageShell } from '@/components/page-shell'
import { StatusBadge } from '@/components/status-badge'

const columns: ColumnDef<ZkProof>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Proof' />
    ),
    cell: ({ row }) => (
      <div className='space-y-0.5'>
        <div className='font-medium'>{row.original.id}</div>
        <div className='text-xs text-muted-foreground'>
          {row.original.contractId}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'circuit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Circuit' />
    ),
    cell: ({ row }) => (
      <div className='space-y-1'>
        <div className='font-mono text-xs'>{row.original.circuit}</div>
        <div className='flex gap-1'>
          <Badge variant='secondary'>{row.original.scheme}</Badge>
          <Badge variant='secondary'>{row.original.curve}</Badge>
        </div>
      </div>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'publicSignals',
    header: 'Public signals',
    cell: ({ row }) => (
      <div className='flex max-w-64 flex-wrap gap-1'>
        {row.original.publicSignals.map((s) => (
          <code key={s} className='rounded bg-muted px-1 text-[11px]'>
            {s}
          </code>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'proveMs',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Prove' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums'>{row.original.proveMs} ms</span>
    ),
  },
  {
    accessorKey: 'verifyMs',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Verify' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums'>{row.original.verifyMs} ms</span>
    ),
  },
  {
    accessorKey: 'gasSui',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Gas (SUI)' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums'>{row.original.gasSui}</span>
    ),
  },
  {
    accessorKey: 'result',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Result' />
    ),
    cell: ({ row }) => <StatusBadge value={row.original.result} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'txDigest',
    header: 'Tx digest',
    cell: ({ row }) => (
      <span className='font-mono text-xs text-muted-foreground'>
        {shortHash(row.original.txDigest)}
      </span>
    ),
  },
  {
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Time (UTC)' />
    ),
    cell: ({ row }) => (
      <span className='text-xs whitespace-nowrap'>
        {format(new Date(row.original.timestamp), 'MMM d, HH:mm')}
      </span>
    ),
  },
]

export function ZkProofs() {
  const stats = [
    { title: 'Median proving time', value: `${summary.medianProveMs} ms` },
    {
      title: 'Median verification time',
      value: `${summary.medianVerifyMs} ms`,
    },
    { title: 'Proof size (compressed)', value: '128 B' },
    { title: 'Mean gas per verification', value: `${summary.meanGasSui} SUI` },
  ]
  const circuits = Array.from(new Set(proofs.map((p) => p.circuit)))

  return (
    <PageShell
      title='ZK Proof Ledger'
      description='Groth16 proofs submitted by service providers and verified on-chain with the native sui::groth16 verifier. Only aggregated public signals and commitments are recorded; device identifiers, patient pseudonyms and deployment locations remain private witnesses.'
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={proofs}
        searchPlaceholder='Search proofs, contracts…'
        filters={[
          {
            columnId: 'result',
            title: 'Result',
            options: ['verified', 'rejected', 'pending'].map((v) => ({
              label: v[0].toUpperCase() + v.slice(1),
              value: v,
            })),
          },
          {
            columnId: 'circuit',
            title: 'Circuit',
            options: circuits.map((c) => ({ label: c, value: c })),
          },
        ]}
      />
    </PageShell>
  )
}
