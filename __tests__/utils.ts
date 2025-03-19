import { render, RenderResult } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { ReactElement } from 'react'
import { vi } from 'vitest'
import { Session } from 'next-auth'

interface SetupResult extends RenderResult {
  user: UserEvent
}

export function setup(jsx: ReactElement): SetupResult {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}

interface FetchResponse<T = any> {
  ok: boolean
  status?: number
  statusText?: string
  json: () => Promise<T>
}

export const mockFetch = <T>(data: T) => {
  return vi.spyOn(global, 'fetch').mockImplementation(
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      } as FetchResponse<T>)
    ) as any
  )
}

export const mockFetchError = (status: number, message: string) => {
  return vi.spyOn(global, 'fetch').mockImplementation(
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status,
        statusText: message,
        json: () => Promise.resolve({ error: message }),
      } as FetchResponse)
    ) as any
  )
}

export const mockSession = (session: Partial<Session> | null) => {
  const useSession = vi.spyOn(require('next-auth/react'), 'useSession')
  useSession.mockReturnValue({
    data: session,
    status: session ? 'authenticated' : 'unauthenticated',
    update: vi.fn(),
  })
  return useSession
}

interface MockRouter {
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
  pathname: string
  query: Record<string, string>
}

export const mockRouter = (): MockRouter => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }
  const useRouter = vi.spyOn(require('next/navigation'), 'useRouter')
  useRouter.mockReturnValue(router)
  return router
}

// Add cleanup utility
export const cleanupMocks = () => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
} 