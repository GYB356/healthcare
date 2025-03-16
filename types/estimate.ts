export type EstimateItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export type Estimate = {
  id: string
  projectId: string
  clientId: string
  date: string
  items: EstimateItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  validUntil: string
}

export type NewEstimate = Omit<Estimate, 'id' | 'subtotal' | 'taxAmount' | 'total'> 