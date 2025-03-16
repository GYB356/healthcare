'use client'

import { Project } from '../types/project'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: () => void
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{project.name}</h3>
          <p className="text-gray-600">{project.address}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
          {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Client:</span> {project.clientName}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Estimated Cost:</span> {formatCurrency(project.estimatedCost)}
        </p>
        {project.description && (
          <p className="text-gray-600">
            <span className="font-medium">Description:</span> {project.description}
          </p>
        )}
        {project.startDate && (
          <p className="text-gray-600">
            <span className="font-medium">Start Date:</span> {new Date(project.startDate).toLocaleDateString()}
          </p>
        )}
        {project.completionDate && (
          <p className="text-gray-600">
            <span className="font-medium">Completion Date:</span> {new Date(project.completionDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end space-x-4">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Delete
        </button>
        <button
          onClick={() => onEdit(project)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  )
} 