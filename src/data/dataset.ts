/**
 * Simulated, reproducible dataset for the prototype console.
 *
 * Values are synthetic and generated from a fixed seed. Orders of magnitude
 * follow publicly reported figures for Groth16 over BN254 (≈128-byte
 * compressed proofs, millisecond-scale verification) and the SLA targets of
 * the research proposal (ECG latency ≤ 2 s, availability ≥ 99 %, glucose
 * updates ≤ 5 min). They are placeholders until the edge/Sui back-end is
 * connected and must not be reported as experimental results.
 */
import { createRng, median, round } from './random'
import type {
  EdgeNode,
  IoTDevice,
  KpiDefinition,
  ProviderOffer,
  SensorKind,
  SlaContract,
  SlaMetric,
  ZkProof,
} from './types'

const rng = createRng(20261019)

const NOW = new Date('2026-10-19T12:00:00Z').getTime()

/* ------------------------------------------------------------------ */
/* Edge layer                                                          */
/* ------------------------------------------------------------------ */

export const edgeNodes: EdgeNode[] = [
  ['edge-icu-01', 'ICU — Building A', 'ecg-anomaly-int8', 78],
  ['edge-icu-02', 'ICU — Building A', 'ecg-anomaly-int8', 64],
  ['edge-ward-03', 'Cardiology Ward', 'ecg-anomaly-int8', 41],
  ['edge-ward-04', 'Geriatrics Ward', 'fall-detect-distilled', 57],
  ['edge-ward-05', 'Endocrinology', 'glucose-forecast-q4', 33],
  ['edge-er-06', 'Emergency Room', 'multi-sensor-fusion', 91],
].map(([id, site, model, cpu]) => {
  const cpuPct = Number(cpu)
  return {
    id: String(id),
    site: String(site),
    inferenceModel: String(model),
    cpuPct,
    memPct: round(rng.float(35, 85), 0),
    energyWh: round(rng.float(9, 24), 1),
    devices: 0,
    medianInferenceMs: round(rng.float(12, 60), 0),
    status:
      cpuPct > 85
        ? 'overloaded'
        : id === 'edge-ward-05'
          ? 'maintenance'
          : 'healthy',
  } satisfies EdgeNode
})

/* ------------------------------------------------------------------ */
/* IoT devices                                                         */
/* ------------------------------------------------------------------ */

const sensorProfile: Record<SensorKind, { hz: number; nodes: string[] }> = {
  ecg: { hz: 250, nodes: ['edge-icu-01', 'edge-icu-02', 'edge-ward-03'] },
  spo2: { hz: 1, nodes: ['edge-icu-01', 'edge-icu-02', 'edge-er-06'] },
  temperature: {
    hz: 0.2,
    nodes: ['edge-ward-03', 'edge-ward-04', 'edge-er-06'],
  },
  glucose: { hz: 1 / 300, nodes: ['edge-ward-05'] },
  camera: { hz: 15, nodes: ['edge-ward-04', 'edge-er-06'] },
}

const kinds: SensorKind[] = [
  'ecg',
  'ecg',
  'ecg',
  'spo2',
  'temperature',
  'glucose',
  'camera',
]

export const devices: IoTDevice[] = Array.from({ length: 48 }, (_, i) => {
  const kind = rng.pick(kinds)
  const profile = sensorProfile[kind]
  const edgeNode = rng.pick(profile.nodes)
  const node = edgeNodes.find((n) => n.id === edgeNode)!
  node.devices += 1
  const battery = round(rng.float(4, 100), 0)
  const roll = rng.next()
  const status: IoTDevice['status'] =
    roll < 0.06
      ? 'offline'
      : battery < 15
        ? 'power-saving'
        : roll < 0.16
          ? 'degraded'
          : 'online'
  return {
    alias: `${kind.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    commitment: `0x${rng.hex(32)}`,
    kind,
    edgeNode,
    ward: node.site,
    status,
    batteryPct: battery,
    samplingHz: status === 'power-saving' ? profile.hz / 2 : profile.hz,
    lastSeenSec: status === 'offline' ? rng.int(600, 7200) : rng.int(0, 30),
  }
})

/* ------------------------------------------------------------------ */
/* SLA contracts                                                       */
/* ------------------------------------------------------------------ */

const providers = [
  'MedEdge Cloud',
  'Saclay HealthNet',
  'BioCompute EU',
  'CareStream IoT',
]
const consumers = [
  'Hôpital Paris-Saclay',
  'Genopole Digital Twin Lab',
  'Clinique Évry',
  'Cardio Research Unit',
]

const metricSpec: Record<
  SlaMetric,
  {
    label: string
    unit: string
    comparator: 'lte' | 'gte'
    threshold: number
    sample: () => number
  }
> = {
  'ecg-latency': {
    label: 'ECG end-to-end latency',
    unit: 's',
    comparator: 'lte',
    threshold: 2,
    sample: () => round(rng.normal(1.35, 0.35), 2),
  },
  'ecg-availability': {
    label: 'Continuous ECG sample availability',
    unit: '%',
    comparator: 'gte',
    threshold: 99,
    sample: () => round(Math.min(100, rng.normal(99.4, 0.35)), 2),
  },
  'glucose-interval': {
    label: 'Glucose update interval',
    unit: 'min',
    comparator: 'lte',
    threshold: 5,
    sample: () => round(rng.normal(4.1, 0.6), 1),
  },
  'auth-decision': {
    label: 'Authorization decision time',
    unit: 's',
    comparator: 'lte',
    threshold: 1,
    sample: () => round(rng.normal(0.62, 0.18), 2),
  },
  uptime: {
    label: 'Edge service uptime',
    unit: '%',
    comparator: 'gte',
    threshold: 99.5,
    sample: () => round(Math.min(100, rng.normal(99.7, 0.18)), 2),
  },
}

export const metricLabels = Object.fromEntries(
  Object.entries(metricSpec).map(([k, v]) => [k, v.label])
) as Record<SlaMetric, string>

export function meetsThreshold(
  observed: number,
  threshold: number,
  comparator: 'lte' | 'gte'
) {
  return comparator === 'lte' ? observed <= threshold : observed >= threshold
}

const metricKeys = Object.keys(metricSpec) as SlaMetric[]

export const contracts: SlaContract[] = Array.from({ length: 24 }, (_, i) => {
  const metric = metricKeys[i % metricKeys.length]
  const spec = metricSpec[metric]
  const observed = spec.sample()
  const roll = rng.next()
  const ok = meetsThreshold(observed, spec.threshold, spec.comparator)
  const status: SlaContract['status'] =
    roll < 0.08
      ? 'negotiating'
      : roll < 0.16
        ? 'pending'
        : ok
          ? 'compliant'
          : 'breached'
  const collateral = round(rng.float(50, 500), 0)
  return {
    id: `SLA-${String(1001 + i)}`,
    objectId: `0x${rng.hex(32)}`,
    provider: rng.pick(providers),
    consumer: rng.pick(consumers),
    metric,
    predicate: `${spec.label} ${spec.comparator === 'lte' ? '≤' : '≥'} ${spec.threshold} ${spec.unit}`,
    threshold: spec.threshold,
    unit: spec.unit,
    comparator: spec.comparator,
    observed,
    status,
    collateralSui: collateral,
    penaltySui: round(collateral * 0.1, 1),
    incentiveSui: round(collateral * 0.02, 1),
    proofs: status === 'negotiating' ? 0 : rng.int(12, 240),
    validUntil: new Date(NOW + rng.int(20, 360) * 86_400_000)
      .toISOString()
      .slice(0, 10),
  }
})

/* ------------------------------------------------------------------ */
/* ZK proof ledger                                                     */
/* ------------------------------------------------------------------ */

const circuitFor: Record<SlaMetric, string> = {
  'ecg-latency': 'sla_latency_le.circom',
  'ecg-availability': 'sla_availability_ge.circom',
  'glucose-interval': 'sla_interval_le.circom',
  'auth-decision': 'access_auth_merkle.circom',
  uptime: 'sla_availability_ge.circom',
}

export const proofs: ZkProof[] = Array.from({ length: 120 }, (_, i) => {
  const contract = rng.pick(contracts.filter((c) => c.status !== 'negotiating'))
  const proveMs = round(Math.max(180, rng.normal(820, 260)), 0)
  const roll = rng.next()
  const result: ZkProof['result'] =
    contract.status === 'breached' && roll < 0.6
      ? 'rejected'
      : roll < 0.04
        ? 'pending'
        : 'verified'
  return {
    id: `PRF-${String(50_000 + i)}`,
    contractId: contract.id,
    circuit: circuitFor[contract.metric],
    scheme: 'Groth16',
    curve: 'BN254',
    publicSignals: [
      `threshold=${contract.threshold}`,
      `window=${rng.pick(['5m', '15m', '1h'])}`,
      `commitRoot=0x${rng.hex(4)}…`,
      `ok=${result === 'rejected' ? 0 : 1}`,
    ],
    proveMs,
    verifyMs: round(Math.max(4, rng.normal(11, 3)), 1),
    sizeBytes: 128,
    gasSui: round(rng.normal(0.0031, 0.0004), 4),
    result,
    txDigest: rng.hex(32),
    timestamp: new Date(NOW - i * rng.int(300, 1800) * 1000).toISOString(),
  }
})

/* ------------------------------------------------------------------ */
/* Time series                                                         */
/* ------------------------------------------------------------------ */

export const latencySeries = Array.from({ length: 24 }, (_, h) => {
  const peak = h >= 8 && h <= 18 ? 0.35 : 0
  return {
    hour: `${String(h).padStart(2, '0')}:00`,
    p50: round(rng.normal(1.1 + peak, 0.08), 2),
    p95: round(rng.normal(1.6 + peak * 1.4, 0.12), 2),
    threshold: 2,
  }
})

export const complianceSeries = Array.from({ length: 14 }, (_, d) => {
  const date = new Date(NOW - (13 - d) * 86_400_000)
  const total = rng.int(380, 520)
  const verified = Math.round(total * Math.min(0.995, rng.normal(0.965, 0.012)))
  return {
    day: date.toISOString().slice(5, 10),
    verified,
    rejected: total - verified,
  }
})

/* ------------------------------------------------------------------ */
/* Scenario 2 — provider offers with hidden infrastructure             */
/* ------------------------------------------------------------------ */

export const providerOffers: ProviderOffer[] = providers.map((provider) => ({
  provider,
  region: rng.pick([
    'eu-west-3 (Paris)',
    'eu-central-1',
    'Saclay on-prem',
    'eu-north-1',
  ]),
  commitment: `0x${rng.hex(32)}`,
  hidden: {
    storageTb: rng.int(2, 40),
    latencyMs: rng.int(40, 260),
    costSuiPerMonth: rng.int(80, 900),
    availabilityPct: round(rng.float(98.8, 99.99), 2),
  },
}))

/* ------------------------------------------------------------------ */
/* Proposal KPIs (Methodology table)                                   */
/* ------------------------------------------------------------------ */

const verified = proofs.filter((p) => p.result === 'verified')
const decided = proofs.filter((p) => p.result !== 'pending')

export const summary = {
  complianceRate: round((verified.length / decided.length) * 100, 1),
  medianProveMs: median(proofs.map((p) => p.proveMs)),
  medianVerifyMs: median(proofs.map((p) => p.verifyMs)),
  meanGasSui: round(
    proofs.reduce((s, p) => s + p.gasSui, 0) / proofs.length,
    4
  ),
  medianLatencyS: median(latencySeries.map((p) => p.p50)),
  activeContracts: contracts.filter(
    (c) => c.status === 'compliant' || c.status === 'breached'
  ).length,
  breachedContracts: contracts.filter((c) => c.status === 'breached').length,
  onlineDevices: devices.filter((d) => d.status === 'online').length,
  totalDevices: devices.length,
}

export const kpis: KpiDefinition[] = [
  {
    kpi: 'Authorization decision time',
    metric: 'median (s)',
    method: 'Measure processing time',
    value: '0.61 s',
    target: '≤ 1 s',
    met: true,
  },
  {
    kpi: 'Integrity verification',
    metric: '% success rate',
    method: 'Hash compare on-chain vs downloaded file',
    value: '99.8 %',
    target: '≥ 99.5 %',
    met: true,
  },
  {
    kpi: 'Authorized access incidents',
    metric: 'count per incident',
    method: 'Security monitoring for authorized failing access',
    value: '2',
    target: '0',
    met: false,
  },
  {
    kpi: 'Resource usage',
    metric: '% CPU',
    method: 'Resource use per task completion',
    value: `${round(edgeNodes.reduce((s, n) => s + n.cpuPct, 0) / edgeNodes.length, 0)} %`,
    target: '≤ 80 %',
    met: true,
  },
  {
    kpi: 'Concurrent requests',
    metric: '% acceptance rate',
    method: 'Authorized user requests for task demands',
    value: '97.2 %',
    target: '≥ 95 %',
    met: true,
  },
  {
    kpi: 'ZKP proof generation time',
    metric: 'median (ms)',
    method: 'Time required for prover to generate a proof',
    value: `${summary.medianProveMs} ms`,
    target: '≤ 2 000 ms',
    met: summary.medianProveMs <= 2000,
  },
  {
    kpi: 'ZKP verification time',
    metric: 'median (ms)',
    method: 'Time required for verifier to validate the proof',
    value: `${summary.medianVerifyMs} ms`,
    target: '≤ 50 ms',
    met: summary.medianVerifyMs <= 50,
  },
  {
    kpi: 'Proof size',
    metric: 'bytes',
    method: 'Serialized size stored off-chain',
    value: '128 B',
    target: '≤ 256 B',
    met: true,
  },
  {
    kpi: 'SLA compliance rate',
    metric: '% success',
    method: 'Completed compliance requests within SLA targets',
    value: `${summary.complianceRate} %`,
    target: '≥ 95 %',
    met: summary.complianceRate >= 95,
  },
  {
    kpi: 'End-to-end latency',
    metric: 'median (s)',
    method: 'Request submission to final verification',
    value: `${summary.medianLatencyS} s`,
    target: '≤ 2 s',
    met: summary.medianLatencyS <= 2,
  },
  {
    kpi: 'Gas cost on Sui',
    metric: 'SUI / tx',
    method: 'Average gas cost per transaction on Sui',
    value: `${summary.meanGasSui} SUI`,
    target: '≤ 0.005 SUI',
    met: summary.meanGasSui <= 0.005,
  },
  {
    kpi: 'Energy consumption (edge)',
    metric: 'Wh',
    method: 'Energy used by edge devices during computation and communication',
    value: `${round(
      edgeNodes.reduce((s, n) => s + n.energyWh, 0),
      1
    )} Wh`,
    target: 'n/a (baseline)',
    met: null,
  },
]

export const edgeEvents = [
  {
    time: '11:58',
    node: 'edge-icu-01',
    kind: 'alert',
    text: 'Abnormal heart rate (tachycardia) detected on ECG-007 — escalated to cardiology.',
  },
  {
    time: '11:52',
    node: 'edge-ward-04',
    kind: 'alert',
    text: 'Fall event detected by CAMERA-019; cross-validated with SPO2-020 before alerting.',
  },
  {
    time: '11:47',
    node: 'edge-er-06',
    kind: 'agent',
    text: 'Agent migrated 2 inference workloads to edge-icu-02 (CPU 91 % > 85 % policy).',
  },
  {
    time: '11:31',
    node: 'edge-ward-03',
    kind: 'agent',
    text: 'Battery < 15 % on TEMPERATURE-031: sampling halved, power-saving mode enabled.',
  },
  {
    time: '11:12',
    node: 'cloud',
    kind: 'model',
    text: 'ecg-anomaly v2.4 retrained in cloud; INT8-quantized build rolled out to 3 edge nodes.',
  },
  {
    time: '10:54',
    node: 'edge-ward-05',
    kind: 'agent',
    text: 'Node placed in maintenance; technical staff notified via MCP intent channel.',
  },
] as const
