'use client'

import { useState, useEffect } from 'react'
import { Client, NewClient } from '../../types/client'
import ClientForm from '../../components/ClientForm'
import ClientCard from '../../components/ClientCard'

const STORAGE_KEY = 'roofing-tracker-clients'

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load clients from local storage on initial render
  useEffect(() => {
    const savedClients = localStorage.getItem(STORAGE_KEY)
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients))
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
  }, [])

  // Save clients to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  }, [clients])

  const handleSubmit = (clientData: NewClient) => {
    if (editingClient) {
      // Update existing client
      setClients(clients.map(c => 
        c.id === editingClient.id 
          ? { 
              ...clientData,
              id: editingClient.id,
              totalProjects: editingClient.totalProjects,
              totalValue: editingClient.totalValue,
              createdAt: editingClient.createdAt,
            }
          : c
      ))
    } else {
      // Add new client
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        totalProjects: 0,
        totalValue: 0,
        createdAt: new Date().toISOString(),
      }
      setClients([...clients, newClient])
    }
    handleCancel()
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  const handleDelete = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(c => c.id !== clientId))
    }
  }

  const filteredClients = clients.filter(client =>
    searchQuery === '' ||
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            New Client
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      {showForm ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingClient ? 'Edit Client' : 'New Client'}
          </h2>
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingClient || undefined}
          />
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onDelete={() => handleDelete(client.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500 text-center">
            {clients.length === 0
              ? 'No clients yet. Click "New Client" to add one.'
              : 'No clients match your search criteria.'}
          </p>
        </div>
      )}
    </div>
  )
} 