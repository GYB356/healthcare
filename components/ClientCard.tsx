'use client'

import { Client } from '../types/client'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: () => void
}

export default function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
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
          <h3 className="text-xl font-semibold">{client.name}</h3>
          <p className="text-gray-600">{client.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Projects: {client.totalProjects}</p>
          <p className="text-sm font-medium text-gray-500">
            Total Value: {formatCurrency(client.totalValue)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Phone:</span> {client.phone}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Address:</span> {client.address}
        </p>
        {client.notes && (
          <p className="text-gray-600">
            <span className="font-medium">Notes:</span> {client.notes}
          </p>
        )}
        <p className="text-gray-500 text-sm">
          Client since {new Date(client.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-4 flex justify-end space-x-4">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Delete
        </button>
        <button
          onClick={() => onEdit(client)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  )
} 