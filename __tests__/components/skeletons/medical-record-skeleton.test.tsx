import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  MedicalRecordSkeleton,
  MedicalRecordListSkeleton,
} from '@/components/skeletons/medical-record-skeleton'

describe('MedicalRecordSkeleton', () => {
  it('should render a single skeleton', () => {
    render(<MedicalRecordSkeleton />)

    // Check for skeleton elements
    const skeletons = screen.getAllByRole('status')
    expect(skeletons.length).toBeGreaterThan(0)

    // Check for Card component
    const card = screen.getByTestId('medical-record-skeleton')
    expect(card).toBeInTheDocument()

    // Check for header and content sections
    expect(screen.getByTestId('skeleton-header')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-content')).toBeInTheDocument()
  })

  it('should have appropriate ARIA attributes', () => {
    render(<MedicalRecordSkeleton />)

    const skeletons = screen.getAllByRole('status')
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
      expect(skeleton).toHaveAttribute('aria-live', 'polite')
    })
  })
})

describe('MedicalRecordListSkeleton', () => {
  it('should render the specified number of skeletons', () => {
    render(<MedicalRecordListSkeleton count={3} />)

    const cards = screen.getAllByTestId('medical-record-skeleton')
    expect(cards).toHaveLength(3)
  })

  it('should render default number of skeletons when count is not provided', () => {
    render(<MedicalRecordListSkeleton />)

    const cards = screen.getAllByTestId('medical-record-skeleton')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should handle zero count', () => {
    render(<MedicalRecordListSkeleton count={0} />)

    const cards = screen.queryAllByTestId('medical-record-skeleton')
    expect(cards).toHaveLength(0)
  })

  it('should handle negative count', () => {
    render(<MedicalRecordListSkeleton count={-1} />)

    const cards = screen.queryAllByTestId('medical-record-skeleton')
    expect(cards).toHaveLength(0)
  })

  it('should maintain consistent skeleton structure for each item', () => {
    render(<MedicalRecordListSkeleton count={2} />)

    const cards = screen.getAllByTestId('medical-record-skeleton')
    cards.forEach(card => {
      expect(card.querySelector('[data-testid="skeleton-header"]')).toBeInTheDocument()
      expect(card.querySelector('[data-testid="skeleton-content"]')).toBeInTheDocument()
    })
  })
}) 