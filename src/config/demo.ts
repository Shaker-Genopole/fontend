/** Demo operator accounts created by the services demo seed (docker compose --profile demo). */
export const DEMO_PASSWORD =
  (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ??
  'demo-password-123'

export const DEMO_ACCOUNTS = [
  {
    label: 'Hospital',
    email:
      (import.meta.env.VITE_DEMO_HOSPITAL as string | undefined) ??
      'ops@hospital.demo',
  },
  {
    label: 'Provider',
    email:
      (import.meta.env.VITE_DEMO_PROVIDER as string | undefined) ??
      'noc@edgecloud.demo',
  },
] as const
