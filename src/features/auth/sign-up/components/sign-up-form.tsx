import { useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { LIVE_API, authApi } from '@/lib/api'
import { sleep, cn } from '@/lib/utils'
import { toAuthUser } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    email: z.email({
      error: (iss) =>
        iss.input === '' ? 'Please enter your email.' : undefined,
    }),
    password: z
      .string()
      .min(1, 'Please enter your password.')
      .min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    role: z.enum(['consumer', 'provider']),
    organisation: z.string().min(2, 'Please enter your organisation.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'consumer',
      organisation: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    if (LIVE_API) {
      const { email, password, role, organisation } = data
      toast.promise(authApi.signUp({ email, password, role, organisation }), {
        loading: 'Creating account...',
        success: ({ token, account }) => {
          setIsLoading(false)
          auth.setUser(toAuthUser(account))
          auth.setAccessToken(token)
          navigate({ to: '/wallet', replace: true })
          return `Welcome, ${account.organisation}. Connect your Sui wallet next.`
        },
        error: (err) => {
          setIsLoading(false)
          return err instanceof AxiosError && err.response?.status === 409
            ? 'This email is already registered.'
            : 'Could not create the account.'
        },
      })
      return
    }

    toast.promise(sleep(2000), {
      loading: 'Creating account...',
      success: () => {
        setIsLoading(false)
        return `Account created for ${data.email}.`
      },
      error: 'Error',
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='grid grid-cols-2 gap-2'
                >
                  <label className='flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm'>
                    <RadioGroupItem value='consumer' /> Hospital
                  </label>
                  <label className='flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm'>
                    <RadioGroupItem value='provider' /> Provider
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='organisation'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisation</FormLabel>
              <FormControl>
                <Input placeholder='University Hospital' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          Create Account
        </Button>
      </form>
    </Form>
  )
}
