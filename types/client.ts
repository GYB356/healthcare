export type Client = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  notes?: string
  totalProjects: number
  totalValue: number
  createdAt: string
}

export type NewClient = Omit<Client, 'id' | 'totalProjects' | 'totalValue' | 'createdAt'> 