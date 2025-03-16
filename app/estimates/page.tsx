 'use client'

import { useState, useEffect } from 'react'
import { Estimate, NewEstimate } from '../../types/estimate'
import { Project } from '../../types/project'
import { Client } from '../../types/client'
import EstimateForm from '../../components/EstimateForm'

const STORAGE_KEY = 'roofing-tracker-estimates'
const PROJECTS_KEY = 'roofing-tracker-projects'
const CLIENTS_KEY = 'roofing-tracker-clients'

export default function EstimatesPage() {
  const [showForm, setShowForm] = useState(false)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null)

  // Load data from local storage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const savedEstimates = localStorage.getItem(STORAGE_KEY)
        if (savedEstimates) {
          setEstimates(JSON.parse(savedEstimates))
        }

        const savedProjects = localStorage.getItem(PROJECTS_KEY)
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects))
        }

        const savedClients = localStorage.getItem(CLIENTS_KEY)
        if (savedClients) {
          setClients(JSON.parse(savedClients))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  // Save estimates to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates))
  }, [estimates])

  const handleSubmit = (estimateData: NewEstimate) => {
    const calculatedTotals = {
      subtotal: estimateData.items.reduce((sum, item) => sum + item.total, 0),
      taxAmount: 0,
      total: 0,
    }
    calculatedTotals.taxAmount = calculatedTotals.subtotal * (estimateData.taxRate / 100)
    calculatedTotals.total = calculatedTotals.subtotal + calculatedTotals.taxAmount

    if (editingEstimate) {
      // Update existing estimate
      setEstimates(estimates.map(e => 
        e.id === editingEstimate.id 
          ? { ...estimateData, ...calculatedTotals, id: editingEstimate.id }
          : e
      ))
    } else {
      // Add new estimate
      const newEstimate: Estimate = {
        ...estimateData,
        ...calculatedTotals,
        id: Date.now().toString(),
      }
      setEstimates([...estimates, newEstimate])
    }
    handleCancel()
  }

  const handleEdit = (estimate: Estimate) => {
    setEditingEstimate(estimate)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingEstimate(null)
  }

  const handleDelete = (estimateId: string) => {
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      setEstimates(estimates.filter(e => e.id !== estimateId))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client'
  }

  const getStatusColor = (status: Estimate['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estimates</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            New Estimate
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingEstimate ? 'Edit Estimate' : 'New Estimate'}
          </h2>
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingEstimate || undefined}
            projects={projects}
            clients={clients}
          />
        </div>
      ) : estimates.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project / Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estimates.map(estimate => (
                  <tr key={estimate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getProjectName(estimate.projectId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getClientName(estimate.clientId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(estimate.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Valid until {new Date(estimate.validUntil).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(estimate.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(estimate)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(estimate.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500 text-center">
            No estimates yet. Click "New Estimate" to create one.
          </p>
        </div>
      )}
    </div>
  )
}