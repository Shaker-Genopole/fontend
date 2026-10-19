import { type ColumnDef } from '@tanstack/react-table'
import { devices } from '@/data/dataset'
import { shortHash } from '@/data/random'
import { type IoTDevice } from '@/data/types'
import { BatteryLow, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import { PageShell } from '@/components/page-shell'
import { StatusBadge } from '@/components/status-badge'

const kindLabel: Record<IoTDevice['kind'], string> = {
  ecg: 'ECG',
  spo2: 'SpO₂',
  temperature: 'Temperature',
  glucose: 'Glucose',
  camera: 'Camera (fall detection)',
}

function formatHz(hz: number) {
  if (hz >= 1) return `${hz} Hz`
  return `1 / ${Math.round(1 / hz)} s`
}

function formatAgo(sec: number) {
  if (sec < 60) return `${sec} s ago`
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`
  return `${Math.round(sec / 3600)} h ago`
}

const columns: ColumnDef<IoTDevice>[] = [
  {
    accessorKey: 'alias',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Device' />
    ),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.alias}</span>
    ),
  },
  {
    accessorKey: 'commitment',
    header: 'Identity commitment',
    cell: ({ row }) => (
      <span className='inline-flex items-center gap-1 font-mono text-xs text-muted-foreground'>
        <EyeOff className='size-3' />
        {shortHash(row.original.commitment, 8, 6)}
      </span>
    ),
  },
  {
    accessorKey: 'kind',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sensor' />
    ),
    cell: ({ row }) => (
      <Badge variant='secondary'>{kindLabel[row.original.kind]}</Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'edgeNode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Edge node' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs'>{row.original.edgeNode}</span>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
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
    accessorKey: 'batteryPct',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Battery' />
    ),
    cell: ({ row }) => {
      const b = row.original.batteryPct
      return (
        <div className='flex items-center gap-2'>
          <div className='h-1.5 w-16 overflow-hidden rounded-full bg-muted'>
            <div
              className={cn(
                'h-full rounded-full',
                b < 15
                  ? 'bg-red-500'
                  : b < 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              )}
              style={{ width: `${b}%` }}
            />
          </div>
          <span className='text-xs tabular-nums'>{b}%</span>
          {b < 15 && <BatteryLow className='size-3 text-red-500' />}
        </div>
      )
    },
  },
  {
    accessorKey: 'samplingHz',
    header: 'Sampling',
    cell: ({ row }) => (
      <span className='text-xs'>{formatHz(row.original.samplingHz)}</span>
    ),
  },
  {
    accessorKey: 'lastSeenSec',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last seen' />
    ),
    cell: ({ row }) => (
      <span className='text-xs text-muted-foreground'>
        {formatAgo(row.original.lastSeenSec)}
      </span>
    ),
  },
]

export function Devices() {
  const nodes = Array.from(new Set(devices.map((d) => d.edgeNode))).sort()
  return (
    <PageShell
      title='IoT Medical Devices'
      description='Sensors and actuators registered to edge nodes. Identifiers that could enable identity leakage — device UUIDs, patient links and precise locations — are replaced by hiding commitments; only the edge node holds the openings.'
    >
      <Alert>
        <EyeOff className='size-4' />
        <AlertTitle>Privacy boundary</AlertTitle>
        <AlertDescription>
          Service providers see the alias, sensor class and aggregated health of
          each device. Commitments let them verify proofs about a device without
          learning which physical device or patient it is.
        </AlertDescription>
      </Alert>
      <DataTable
        columns={columns}
        data={devices}
        searchPlaceholder='Search devices…'
        filters={[
          {
            columnId: 'kind',
            title: 'Sensor',
            options: Object.entries(kindLabel).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            columnId: 'status',
            title: 'Status',
            options: ['online', 'degraded', 'power-saving', 'offline'].map(
              (v) => ({
                value: v,
                label: v.replace('-', ' '),
              })
            ),
          },
          {
            columnId: 'edgeNode',
            title: 'Edge node',
            options: nodes.map((n) => ({ value: n, label: n })),
          },
        ]}
      />
    </PageShell>
  )
}
