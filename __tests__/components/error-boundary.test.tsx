import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/error-boundary'

// Mock console.error to prevent test output noise
const originalError = console.error
beforeAll(() => {
  console.error = vi.fn()
})
afterAll(() => {
  console.error = originalError
})

// Component that throws an error
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test Error" />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Test Error/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom Error: {error.message}</div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError message="Custom Test Error" />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Custom Error: Custom Test Error/i)).toBeInTheDocument()
  })

  it('should reset error state when try again is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true)

      if (shouldThrow) {
        throw new Error('Initial Error')
      }

      return <div>Recovered Content</div>
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    
    expect(screen.getByText('Recovered Content')).toBeInTheDocument()
  })

  it('should handle nested errors', () => {
    render(
      <ErrorBoundary>
        <div>Outer Content</div>
        <ErrorBoundary>
          <ThrowError message="Nested Error" />
        </ErrorBoundary>
      </ErrorBoundary>
    )

    expect(screen.getByText('Outer Content')).toBeInTheDocument()
    expect(screen.getByText(/Nested Error/i)).toBeInTheDocument()
  })

  it('should log errors in development', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError message="Development Error" />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()

    process.env.NODE_ENV = originalNodeEnv
  })
}) 