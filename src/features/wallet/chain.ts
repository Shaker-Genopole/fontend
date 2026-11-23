// Transaction builders and effect readers for the zk_sla Move package.
import { coinWithBalance, Transaction } from '@mysten/sui/transactions'
import type { SlaTerms } from '@/lib/api'
import { ZK_SLA, dAppKit } from '@/lib/sui'

const target = (fn: string) => `${ZK_SLA.packageId}::sla::${fn}`

/** sla::new_terms + sla::propose, escrowing reward x periods from the hospital wallet. */
export function proposeTx(terms: SlaTerms, providerAddress: string) {
  const tx = new Transaction()
  const t = tx.moveCall({
    target: target('new_terms'),
    arguments: [
      terms.maxLatencyMs,
      terms.latencyQuorumBp,
      terms.minAvailabilityBp,
      terms.maxIntervalSec,
      terms.periodMs,
      terms.totalPeriods,
      terms.graceMs,
      terms.rewardPerPeriod,
      terms.penaltyPerPeriod,
    ].map((v) => tx.pure.u64(v)),
  })
  const budget = coinWithBalance({
    balance: BigInt(terms.rewardPerPeriod) * BigInt(terms.totalPeriods),
  })
  tx.moveCall({
    target: target('propose'),
    arguments: [t, tx.pure.address(providerAddress), budget],
  })
  return tx
}

/** sla::accept, locking penalty x periods of collateral and the deployment commitment. */
export function acceptTx(
  agreementId: string,
  terms: SlaTerms,
  deploymentCommitment: string
) {
  const tx = new Transaction()
  const collateral = coinWithBalance({
    balance: BigInt(terms.penaltyPerPeriod) * BigInt(terms.totalPeriods),
  })
  tx.moveCall({
    target: target('accept'),
    arguments: [
      tx.object(agreementId),
      tx.pure.u256(BigInt(deploymentCommitment)),
      collateral,
      tx.object.clock(),
    ],
  })
  return tx
}

/** sla::submit_proof from the provider wallet; the reward coin returns to the sender. */
export function submitProofTx(
  agreementId: string,
  period: number,
  metricsCommitment: string,
  proofHex: string,
  sender: string
) {
  const tx = new Transaction()
  const bytes = Array.from(proofHex.match(/../g) ?? [], (h) => parseInt(h, 16))
  const reward = tx.moveCall({
    target: target('submit_proof'),
    arguments: [
      tx.object(agreementId),
      tx.object(ZK_SLA.registryId),
      tx.pure.u64(period),
      tx.pure.u256(BigInt(metricsCommitment)),
      tx.pure.vector('u8', bytes),
      tx.object.clock(),
    ],
  })
  tx.transferObjects([reward], sender)
  return tx
}

export interface Executed {
  digest: string
  createdAgreementId?: string
  startMs?: number
}

/** Signs and executes with the connected wallet, then reads created objects and events. */
export async function execute(tx: Transaction): Promise<Executed> {
  const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
  if (result.FailedTransaction) {
    throw new Error(
      `Transaction failed: ${result.FailedTransaction.status.error?.message ?? 'unknown error'}`
    )
  }
  const digest = result.Transaction.digest
  const full = await dAppKit.getClient().waitForTransaction({
    digest,
    include: { effects: true, objectTypes: true, events: true },
  })
  const t = full.Transaction ?? full.FailedTransaction
  const types = (t?.objectTypes ?? {}) as Record<string, string>
  const created = t?.effects?.changedObjects.find(
    (o) =>
      o.idOperation === 'Created' &&
      types[o.objectId]?.endsWith('::sla::Agreement')
  )
  const activated = t?.events?.find((e) =>
    e.eventType.endsWith('::sla::AgreementActivated')
  )
  const startMs = activated?.json?.['start_ms']
  return {
    digest,
    createdAgreementId: created?.objectId,
    startMs: startMs === undefined ? undefined : Number(startMs),
  }
}

export async function suiBalance(owner: string) {
  const { balance } = await dAppKit.getClient().getBalance({ owner })
  return balance.balance
}
