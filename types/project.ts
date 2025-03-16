export type Project = {
  id: string
  name: string
  address: string
  clientName: string
  status: 'pending' | 'in_progress' | 'completed'
  startDate?: string
  completionDate?: string
  description?: string
  estimatedCost: number
}

export type NewProject = Omit<Project, 'id'> 