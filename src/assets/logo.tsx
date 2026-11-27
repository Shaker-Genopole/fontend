import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Smart Intelligent System mark: a hexagonal block (blockchain) holding a
 * heartbeat whose peaks are network nodes (healthcare IoT).
 * Source: docs/logo.drawio.
 */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const gradient = useId()
  return (
    <svg
      id='sis-logo'
      viewBox='0 0 64 64'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      className={cn('size-6', className)}
      {...props}
    >
      <title>Smart Intelligent System</title>
      <defs>
        <linearGradient id={gradient} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#1687c9' />
          <stop offset='1' stopColor='#17324b' />
        </linearGradient>
      </defs>
      <path
        d='M32 3 L57 17.5 V46.5 L32 61 L7 46.5 V17.5 Z'
        fill={`url(#${gradient})`}
        stroke='#ffffff'
        strokeWidth='1.5'
      />
      <path
        d='M32 9 L52 20.5 V43.5 L32 55 L12 43.5 V20.5 Z'
        fill='none'
        stroke='#ffffff'
        strokeOpacity='0.3'
        strokeWidth='1.25'
      />
      <polyline
        points='12,34 21,34 25.5,25 31,44 36.5,19 41,34 52,34'
        fill='none'
        stroke='#ffffff'
        strokeWidth='3.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='25.5' cy='25' r='2.75' fill='#ffffff' />
      <circle cx='31' cy='44' r='2.75' fill='#ffffff' />
      <circle
        cx='36.5'
        cy='19'
        r='4.5'
        fill='#63003c'
        stroke='#ffffff'
        strokeWidth='2.25'
      />
    </svg>
  )
}
