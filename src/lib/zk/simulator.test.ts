import { describe, expect, it } from 'vitest'
import { commitWitness, evaluatePredicate, sha256Hex } from './simulator'

const witness = {
  deviceUuid: '7b0c1f9e-0000-4000-8000-000000000001',
  patientPseudonym: 'pt-abc123',
  location: 'Building A / ICU / Bed 7',
  measurements: [1.1, 1.4, 2.3],
  salt: '00ff',
}

describe('sha256Hex', () => {
  it('matches the SHA-256 test vector for "abc"', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
})

describe('commitWitness', () => {
  it('is deterministic for the same witness', async () => {
    expect(await commitWitness(witness)).toBe(await commitWitness(witness))
  })

  it('changes when the salt changes (hiding)', async () => {
    const a = await commitWitness(witness)
    const b = await commitWitness({ ...witness, salt: '0100' })
    expect(a).not.toBe(b)
  })

  it('does not contain the private identifiers', async () => {
    const c = await commitWitness(witness)
    expect(c).toMatch(/^0x[0-9a-f]{64}$/)
    expect(c).not.toContain(witness.patientPseudonym)
  })
})

describe('evaluatePredicate', () => {
  it('computes the share of samples satisfying an upper bound', () => {
    const r = evaluatePredicate([1, 1.5, 2, 3], {
      threshold: 2,
      comparator: 'lte',
      quorum: 0.75,
    })
    expect(r.ratio).toBe(0.75)
    expect(r.satisfied).toBe(true)
  })

  it('fails when the quorum is not reached', () => {
    const r = evaluatePredicate([98, 99.5, 99.9], {
      threshold: 99,
      comparator: 'gte',
      quorum: 1,
    })
    expect(r.satisfied).toBe(false)
  })

  it('returns a zero ratio for an empty window', () => {
    expect(
      evaluatePredicate([], { threshold: 1, comparator: 'lte', quorum: 0 })
        .ratio
    ).toBe(0)
  })
})
