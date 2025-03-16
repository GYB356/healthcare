'use client'

import { useState, useEffect, useMemo } from 'react'
import ProjectForm from '../../components/ProjectForm'
import ProjectCard from '../../components/ProjectCard'
import ProjectFilters from '../../components/ProjectFilters'
import ProjectStats from '../../components/ProjectStats'
import { Project, NewProject } from '../../types/project'

const STORAGE_KEY = 'roofing-tracker-projects'

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [costRange, setCostRange] = useState({ min: 0, max: 0 })

  // Load projects from local storage on initial render
  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY)
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects))
      } catch (error) {
        console.error('Error loading projects:', error)
      }
    }
  }, [])

  // Save projects to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const handleSubmit = (projectData: NewProject) => {
    if (editingProject) {
      // Update existing project
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...projectData, id: editingProject.id }
          : p
      ))
    } else {
      // Add new project
      const newProject: Project = {
        ...projectData,
        id: Date.now().toString(), // Simple ID generation for demo
      }
      setProjects([...projects, newProject])
    }
    handleCancel()
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const handleDelete = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId))
    }
  }

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesSearch = searchQuery.toLowerCase() === '' ||
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.address.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === '' || project.status === statusFilter

        const matchesDateRange = (!dateRange.start || !project.startDate || new Date(project.startDate) >= new Date(dateRange.start)) &&
          (!dateRange.end || !project.startDate || new Date(project.startDate) <= new Date(dateRange.end))

        const matchesCostRange = (!costRange.min || project.estimatedCost >= costRange.min) &&
          (!costRange.max || project.estimatedCost <= costRange.max)

        return matchesSearch && matchesStatus && matchesDateRange && matchesCostRange
      })
      .sort((a, b) => {
        const isDescending = sortBy.startsWith('-')
        const field = isDescending ? sortBy.slice(1) : sortBy
        
        if (field === 'name') {
          return isDescending
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name)
        }
        
        if (field === 'estimatedCost') {
          return isDescending
            ? b.estimatedCost - a.estimatedCost
            : a.estimatedCost - b.estimatedCost
        }
        
        if (field === 'status') {
          return a.status.localeCompare(b.status)
        }
        
        if (field === 'startDate') {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
          return dateA - dateB
        }
        
        return 0
      })
  }, [projects, searchQuery, statusFilter, sortBy, dateRange, costRange])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            New Project
          </button>
        )}
      </div>

      {!showForm && (
        <>
          <ProjectStats projects={projects} />
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            costRange={costRange}
            onCostRangeChange={setCostRange}
          />
        </>
      )}

      {showForm ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h2>
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingProject || undefined}
          />
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500 text-center">
            {projects.length === 0
              ? 'No projects yet. Click "New Project" to create one.'
              : 'No projects match your search criteria.'}
          </p>
        </div>
      )}
    </div>
  )
}