import { complianceSeries, latencySeries } from '@/data/dataset'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const axis = {
  stroke: 'var(--muted-foreground)',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const

const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--popover-foreground)',
    fontSize: 12,
  },
}

export function LatencyChart() {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={latencySeries} margin={{ left: -12, right: 8 }}>
        <CartesianGrid
          strokeDasharray='3 3'
          stroke='var(--border)'
          vertical={false}
        />
        <XAxis dataKey='hour' {...axis} interval={3} />
        <YAxis {...axis} direction='ltr' unit=' s' domain={[0, 2.6]} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine
          y={2}
          stroke='var(--destructive)'
          strokeDasharray='4 4'
          label={{
            value: 'SLA bound 2 s',
            fill: 'var(--destructive)',
            fontSize: 11,
            position: 'insideTopRight',
          }}
        />
        <Area
          type='monotone'
          dataKey='p95'
          name='p95 latency'
          stroke='var(--chart-1)'
          fill='var(--chart-1)'
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          type='monotone'
          dataKey='p50'
          name='median latency'
          stroke='var(--chart-2)'
          fill='var(--chart-2)'
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ComplianceChart() {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <BarChart data={complianceSeries} margin={{ left: -12, right: 8 }}>
        <CartesianGrid
          strokeDasharray='3 3'
          stroke='var(--border)'
          vertical={false}
        />
        <XAxis dataKey='day' {...axis} />
        <YAxis {...axis} direction='ltr' />
        <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey='verified'
          name='verified proofs'
          stackId='a'
          fill='var(--chart-2)'
        />
        <Bar
          dataKey='rejected'
          name='rejected proofs'
          stackId='a'
          fill='var(--chart-1)'
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
