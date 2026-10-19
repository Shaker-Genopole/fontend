/**
 * Client-side simulation of the Groth16 SLA-compliance workflow.
 *
 * The real pipeline (proposal, Figure 3) is:
 *   1. the edge node commits to private witness data (device UUID, patient
 *      pseudonym, location, raw QoS measurements) with a hiding commitment;
 *   2. a Circom circuit proves `measurement ⋈ threshold` for the committed
 *      values and outputs only aggregated public signals;
 *   3. the proof is verified on Sui through the native `sui::groth16` module
 *      and the SLA smart contract settles penalty or incentive.
 *
 * This module reproduces the data flow and the information boundary of that
 * pipeline in the browser. Commitments are genuine SHA-256 digests computed
 * with WebCrypto (the circuit itself would use Poseidon); proof elements and
 * timings are simulated. No cryptographic soundness is claimed.
 */

export type Comparator = 'lte' | 'gte'

export type PrivateWitness = {
  deviceUuid: string
  patientPseudonym: string
  location: string
  measurements: number[]
  salt: string
}

export type PublicStatement = {
  contractId: string
  metric: string
  threshold: number
  comparator: Comparator
  /** Fraction of samples that must satisfy the predicate (e.g. 0.99). */
  quorum: number
}

export type ProofStage =
  | 'commit'
  | 'witness'
  | 'prove'
  | 'submit'
  | 'verify'
  | 'settle'

export type StageEvent = {
  stage: ProofStage
  label: string
  detail: string
  durationMs: number
}

export type SimulatedProof = {
  commitment: string
  publicSignals: Record<string, string | number>
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] }
  sizeBytes: number
  proveMs: number
  verifyMs: number
  gasSui: number
  txDigest: string
  satisfied: boolean
  satisfiedRatio: number
}

const encoder = new TextEncoder()

export async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomHex(bytes: number) {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function commitWitness(w: PrivateWitness) {
  const preimage = [
    w.deviceUuid,
    w.patientPseudonym,
    w.location,
    w.measurements.join(','),
    w.salt,
  ].join('|')
  return `0x${await sha256Hex(preimage)}`
}

export function evaluatePredicate(
  measurements: number[],
  statement: Pick<PublicStatement, 'threshold' | 'comparator' | 'quorum'>
) {
  const ok = measurements.filter((m) =>
    statement.comparator === 'lte'
      ? m <= statement.threshold
      : m >= statement.threshold
  ).length
  const ratio = measurements.length ? ok / measurements.length : 0
  return { ratio, satisfied: ratio >= statement.quorum }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Runs the simulated pipeline, reporting each stage through `onStage`.
 * Only `publicSignals` and the commitment would be visible to the provider
 * and to the chain; the witness never leaves this function.
 */
export async function runProofPipeline(
  witness: PrivateWitness,
  statement: PublicStatement,
  onStage: (e: StageEvent) => void
): Promise<SimulatedProof> {
  const t0 = performance.now()
  const commitment = await commitWitness(witness)
  onStage({
    stage: 'commit',
    label: 'Commit private witness',
    detail: `H(device ‖ patient ‖ location ‖ samples ‖ salt) = ${commitment.slice(0, 18)}…`,
    durationMs: Math.round(performance.now() - t0),
  })

  await sleep(250)
  const { ratio, satisfied } = evaluatePredicate(
    witness.measurements,
    statement
  )
  onStage({
    stage: 'witness',
    label: 'Compute circuit witness',
    detail: `${witness.measurements.length} samples evaluated against the ${statement.comparator === 'lte' ? '≤' : '≥'} ${statement.threshold} constraint inside the circuit`,
    durationMs: 250,
  })

  const proveMs = Math.round(
    500 + witness.measurements.length * 3 + Math.random() * 400
  )
  await sleep(Math.min(proveMs, 1200))
  const g1 = () => [`0x${randomHex(32)}`, `0x${randomHex(32)}`]
  const proof = {
    pi_a: g1(),
    pi_b: [g1(), g1()],
    pi_c: g1(),
  }
  onStage({
    stage: 'prove',
    label: 'Generate Groth16 proof (BN254)',
    detail: 'π = (A ∈ G₁, B ∈ G₂, C ∈ G₁) — 128 bytes compressed',
    durationMs: proveMs,
  })

  await sleep(350)
  const txDigest = randomHex(32)
  onStage({
    stage: 'submit',
    label: 'Submit to Sui SLA contract',
    detail: `sla::submit_proof(${statement.contractId}, π, public_inputs) · tx ${txDigest.slice(0, 10)}…`,
    durationMs: 350,
  })

  const verifyMs = Math.round(8 + Math.random() * 6)
  await sleep(300)
  onStage({
    stage: 'verify',
    label: 'On-chain verification',
    detail: `sui::groth16::verify_groth16_proof → ${satisfied ? 'true' : 'false'}`,
    durationMs: verifyMs,
  })

  await sleep(250)
  onStage({
    stage: 'settle',
    label: satisfied ? 'Settle: incentive released' : 'Settle: penalty applied',
    detail: satisfied
      ? 'SLA object updated, provider incentive transferred from escrow'
      : 'SLA breach recorded, penalty deducted from provider collateral',
    durationMs: 120,
  })

  return {
    commitment,
    publicSignals: {
      contract: statement.contractId,
      threshold: statement.threshold,
      comparator: statement.comparator,
      quorum: statement.quorum,
      commitment: `${commitment.slice(0, 18)}…`,
      ok: satisfied ? 1 : 0,
    },
    proof,
    sizeBytes: 128,
    proveMs,
    verifyMs,
    gasSui: Number((0.0026 + Math.random() * 0.001).toFixed(4)),
    txDigest,
    satisfied,
    satisfiedRatio: ratio,
  }
}
