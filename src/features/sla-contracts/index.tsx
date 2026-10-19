import { type ColumnDef } from '@tanstack/react-table'
import { contracts, meetsThreshold, metricLabels } from '@/data/dataset'
import { shortHash } from '@/data/random'
import { type SlaContract } from '@/data/types'
import { FileCheck2, Scale, ShieldAlert, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import { PageShell } from '@/components/page-shell'
import { StatusBadge } from '@/components/status-badge'

const columns: ColumnDef<SlaContract>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Contract' />
    ),
    cell: ({ row }) => (
      <div className='space-y-0.5'>
        <div className='font-medium'>{row.original.id}</div>
        <div className='font-mono text-xs text-muted-foreground'>
          {shortHash(row.original.objectId)}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'provider',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Provider → Consumer' />
    ),
    cell: ({ row }) => (
      <div className='space-y-0.5'>
        <div>{row.original.provider}</div>
        <div className='text-xs text-muted-foreground'>
          {row.original.consumer}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'metric',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='SLA predicate' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.predicate}</span>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'observed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Proven value' />
    ),
    cell: ({ row }) => {
      const c = row.original
      if (c.status === 'negotiating')
        return <span className='text-muted-foreground'>—</span>
      const ok = meetsThreshold(c.observed, c.threshold, c.comparator)
      return (
        <span
          className={ok ? '' : 'font-medium text-red-600 dark:text-red-400'}
        >
          {c.observed} {c.unit}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'collateralSui',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Escrow (SUI)' />
    ),
    cell: ({ row }) => (
      <div className='text-sm tabular-nums'>
        {row.original.collateralSui}
        <div className='text-xs text-muted-foreground'>
          −{row.original.penaltySui} / +{row.original.incentiveSui}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'proofs',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Proofs' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums'>{row.original.proofs}</span>
    ),
  },
  {
    accessorKey: 'validUntil',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Valid until' />
    ),
  },
]

export function SlaContracts() {
  const active = contracts.filter(
    (c) => c.status === 'compliant' || c.status === 'breached'
  )
  const breached = contracts.filter((c) => c.status === 'breached')
  const escrow = contracts.reduce((s, c) => s + c.collateralSui, 0)
  const negotiating = contracts.filter((c) => c.status === 'negotiating')

  const stats = [
    { title: 'Active agreements', value: active.length, icon: FileCheck2 },
    {
      title: 'Breached (penalised)',
      value: breached.length,
      icon: ShieldAlert,
    },
    { title: 'Under negotiation', value: negotiating.length, icon: Scale },
    {
      title: 'Collateral in escrow',
      value: `${escrow.toLocaleString()} SUI`,
      icon: Wallet,
    },
  ]

  return (
    <PageShell
      title='SLA Contracts'
      description='Service-level agreements deployed as shared Move objects on Sui. Each agreement encodes a QoS predicate, escrowed collateral and the penalty/incentive rule that is executed automatically when a zero-knowledge compliance proof is verified.'
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{s.title}</CardTitle>
              <s.icon className='size-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={contracts}
        searchPlaceholder='Search contracts, providers…'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: ['compliant', 'breached', 'pending', 'negotiating'].map(
              (v) => ({
                label: v[0].toUpperCase() + v.slice(1),
                value: v,
              })
            ),
          },
          {
            columnId: 'metric',
            title: 'Metric',
            options: Object.entries(metricLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />
    </PageShell>
  )
}
