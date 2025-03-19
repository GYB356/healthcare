import { describe, it, expect } from 'vitest'
import {
  cn,
  formatDate,
  formatDateTime,
  formatFileSize,
  getInitials,
} from '@/lib/utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('base', 'extra')).toBe('base extra')
    expect(cn('base', { conditional: true })).toBe('base conditional')
    expect(cn('base', { conditional: false })).toBe('base')
    expect(cn('base', null, undefined, 'extra')).toBe('base extra')
  })

  it('should handle tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
    expect(cn('text-sm font-bold', 'text-lg')).toBe('text-lg font-bold')
  })
})

describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-03-15')
    expect(formatDate(date)).toBe('March 15, 2024')
  })

  it('should handle invalid dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
  })
})

describe('formatDateTime', () => {
  it('should format date and time correctly', () => {
    const date = new Date('2024-03-15T14:30:00')
    expect(formatDateTime(date)).toBe('March 15, 2024, 2:30 PM')
  })

  it('should handle invalid dates', () => {
    expect(formatDateTime(new Date('invalid'))).toBe('Invalid Date')
  })
})

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('should handle decimal places correctly', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1600)).toBe('1.6 KB')
  })

  it('should handle invalid input', () => {
    expect(formatFileSize(-1)).toBe('0 B')
    expect(formatFileSize(NaN)).toBe('0 B')
  })
})

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Alice Bob Charlie')).toBe('ABC')
  })

  it('should handle single word names', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('should handle empty strings', () => {
    expect(getInitials('')).toBe('')
  })

  it('should handle whitespace', () => {
    expect(getInitials('   John   Doe   ')).toBe('JD')
  })

  it('should handle special characters', () => {
    expect(getInitials('Jean-Pierre Dubois')).toBe('JD')
  })
}) 