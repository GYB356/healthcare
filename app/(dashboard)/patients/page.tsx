"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, UserPlus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  patientProfile: {
    bloodType: string | null
    allergies: string | null
    medications: string | null
    chronicConditions: string | null
  } | null
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  } | null
  insurance: {
    provider: string
    policyNumber: string
    expirationDate: string
  } | null
}

interface PaginationData {
  total: number
  pages: number
  page: number
  limit: number
}

export default function PatientsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.role !== "DOCTOR") {
      router.push("/dashboard")
      return
    }

    fetchPatients()
  }, [session, router, pagination.page, search])

  const fetchPatients = async () => {
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      })

      const response = await fetch(`/api/patients?${searchParams}`)
      if (!response.ok) {
        throw new Error("Failed to fetch patients")
      }

      const data = await response.json()
      setPatients(data.patients)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching patients:", error)
      toast.error("Failed to load patients")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Button asChild>
          <Link href="/patients/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Demographics</TableHead>
                    <TableHead>Medical Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-gray-500">
                              {patient.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{patient.phone}</p>
                            {patient.emergencyContact && (
                              <p className="text-sm text-gray-500">
                                Emergency: {patient.emergencyContact.name} (
                                {patient.emergencyContact.relationship})
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>
                              {patient.dateOfBirth &&
                                new Date(patient.dateOfBirth).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {patient.gender}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {patient.patientProfile?.bloodType && (
                              <p>Blood: {patient.patientProfile.bloodType}</p>
                            )}
                            {patient.patientProfile?.allergies && (
                              <p className="text-sm text-gray-500 truncate">
                                Allergies: {patient.patientProfile.allergies}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/patients/${patient.id}`}>
                              View Profile
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          isActive={pagination.page > 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.pages }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            onClick={() => handlePageChange(i + 1)}
                            isActive={pagination.page === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          isActive={pagination.page < pagination.pages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}