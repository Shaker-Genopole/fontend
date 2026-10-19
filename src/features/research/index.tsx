import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'

const objectives = [
  'Identify key risks and challenges — potential attacks and identity leakage — in the secure sharing of EHRs across large-scale IoT healthcare environments, through a comprehensive state-of-the-art review.',
  'Design a trust-based, privacy-preserving and formally specified EHR sharing model ensuring confidentiality, integrity and controlled access.',
  'Implement the model with blockchain and zk-SNARKs and evaluate its security, performance and scalability in realistic IoT healthcare cases.',
  'Develop and validate QoS and SLA mechanisms using smart contracts, enabling transparent, verifiable service compliance between providers and consumers.',
  'Prepare the technical foundations for high-impact publications (e.g. IEEE Internet of Things Journal) and applied demonstrations at international hackathons.',
]

const modules = [
  [
    'SLA Overview',
    'Aggregated compliance, latency, proving cost and the evaluation KPI matrix.',
  ],
  [
    'SLA Contracts',
    'Agreements as Sui objects with escrowed collateral and penalty/incentive rules.',
  ],
  [
    'ZK Proof Ledger',
    'Groth16 proofs with public signals, timings, size, gas and verification outcome.',
  ],
  [
    'Proof Lab (Scenario 1)',
    'Interactive SLA compliance verification with an explicit private/public boundary.',
  ],
  [
    'Resource Negotiation (Scenario 2)',
    'Constraint-based provider selection over hidden, committed capabilities.',
  ],
  [
    'IoT Devices',
    'Sensor inventory in which identifiers are replaced by hiding commitments.',
  ],
  [
    'Edge–Cloud Infrastructure',
    'Edge resource state and AI-agent mitigations (sampling, migration, power saving).',
  ],
]

const references = [
  'Čapko, D. V. (2022). State of the art of zero-knowledge proofs in blockchain. 30th Telecommunications Forum (TELFOR), 1–4.',
  'Doss, S. P. (2021). Memetic optimization with cryptographic encryption for secure medical data transmission in IoT-based distributed systems. Computers, Materials & Continua, 66(2), 1577–1594.',
  'Makhdoom, I. Z. (2020). PrivySharing: A blockchain-based framework for privacy-preserving and secure data sharing in smart cities. Computers & Security, 88, 101653.',
  'Sun, X. Y. (2021). A survey on zero-knowledge proof in blockchain. IEEE Network, 35(4), 198–205.',
  'Taherdoost, H. (2023). Smart contracts in blockchain technology: A critical review. Information, 14(2), 117.',
  'Taherdoost, H. (2023). The role of blockchain in medical data sharing. Cryptography, 7(3), 36.',
  'Xu, Y. S. (2023). A two-dimensional sharding model for access control and data privilege management of blockchain. Simulation Modelling Practice and Theory, 122, 102678.',
  'Zheng, X. (2024). Research on blockchain smart contract technology based on resistance to quantum computing attacks. PLOS ONE, 19(5), e0302325.',
]

export function Research() {
  return (
    <PageShell
      title='Research Context'
      description='Zero-Knowledge Smart Contracts for Service-Level Agreements in Microservice Healthcare Edge-Cloud AIoT Deployment Applications.'
    >
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Problem statement</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm leading-relaxed text-muted-foreground'>
            <p>
              Healthcare IoT deployments depend on service-level agreements that
              guarantee availability, latency, reliability and integrity, yet
              these agreements are usually enforced by centralised providers
              with limited transparency and weak accountability. At the same
              time, giving providers full visibility into a deployment — device
              identifiers, patient links, sensor locations — creates a risk of
              identity leakage and targeted attacks.
            </p>
            <p>
              The project investigates whether zk-SNARK proofs (Groth16)
              verified natively on the Sui blockchain can let providers
              demonstrate QoS compliance, and let consumers verify it, while
              sensitive deployment data remains private. Smart contracts then
              enforce penalties and incentives autonomously.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>COSMO Team, ISIBC Laboratory</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <p>
              <span className='font-medium'>Huyen-Trang Le</span> — researcher
            </p>
            <p>
              <span className='font-medium'>Huu-Hung Vuong</span> — core
              developer
            </p>
            <p className='pt-2 text-muted-foreground'>
              Supervised by Dr. Adnan Imeri and Prof. Nazim Agoulmine.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className='list-decimal space-y-2 ps-5 text-sm text-muted-foreground'>
              {objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Console modules</CardTitle>
            <CardDescription>
              How the prototype maps onto the proposed architecture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className='space-y-2 text-sm'>
              {modules.map(([name, text]) => (
                <div key={name}>
                  <dt className='font-medium'>{name}</dt>
                  <dd className='text-muted-foreground'>{text}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selected references</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            {references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  )
}
