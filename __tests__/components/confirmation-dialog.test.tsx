import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationDialog } from '@/components/confirmation-dialog'

describe('ConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Title',
    description: 'Test Description',
    actionLabel: 'Confirm',
    cancelLabel: 'Cancel',
  }

  it('should render with default props', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Confirm'))
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onOpenChange when cancel button is clicked', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should not render when open is false', () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('should render with destructive variant', () => {
    render(<ConfirmationDialog {...defaultProps} variant="destructive" />)

    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('bg-destructive')
  })

  it('should render with custom labels', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        actionLabel="Delete"
        cancelLabel="Go Back"
      />
    )

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('should handle keyboard interactions', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    // Press Escape key
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)

    // Press Enter key on confirm button
    fireEvent.keyDown(screen.getByText('Confirm'), { key: 'Enter' })
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })
}) 