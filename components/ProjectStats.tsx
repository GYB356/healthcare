'use client'

import { Project } from '../types/project'

interface ProjectStatsProps {
  projects: Project[]
}

export default function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalValue: projects.reduce((sum, p) => sum + p.estimatedCost, 0),
    avgCost: projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.estimatedCost, 0) / projects.length 
      : 0,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
        <p className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
        <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Completed</h3>
        <p className="mt-1 text-2xl font-semibold text-green-600">{stats.completed}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Average Cost</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(stats.avgCost)}</p>
      </div>
    </div>
  )
} 