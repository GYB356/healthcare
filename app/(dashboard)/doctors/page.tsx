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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, UserPlus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  doctorProfile: {
    qualifications: string
    experience: string
    acceptingPatients: boolean
  } | null
  availability: Array<{
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
}

interface PaginationData {
  total: number
  pages: number
  page: number
  limit: number
}

export default function DoctorsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  })
  const [search, setSearch] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [acceptingPatients, setAcceptingPatients] = useState<boolean | "">("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDoctors()
  }, [pagination.page, search, specialization, acceptingPatients])

  const fetchDoctors = async () => {
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(specialization && { specialization }),
        ...(acceptingPatients !== "" && {
          acceptingPatients: acceptingPatients.toString(),
        }),
      })

      const response = await fetch(`/api/doctors?${searchParams}`)
      if (!response.ok) {
        throw new Error("Failed to fetch doctors")
      }

      const data = await response.json()
      setDoctors(data.doctors)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching doctors:", error)
      toast.error("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSpecializationChange = (value: string) => {
    setSpecialization(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleAcceptingPatientsChange = (value: string) => {
    setAcceptingPatients(value === "" ? "" : value === "true")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Doctors</h1>
        {session?.user.role === "ADMIN" && (
          <Button asChild>
            <Link href="/doctors/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Doctor
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={specialization}
              onValueChange={handleSpecializationChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Specializations</SelectItem>
                <SelectItem value="GENERAL_PRACTICE">General Practice</SelectItem>
                <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                <SelectItem value="DERMATOLOGY">Dermatology</SelectItem>
                <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                <SelectItem value="ORTHOPEDICS">Orthopedics</SelectItem>
                <SelectItem value="PSYCHIATRY">Psychiatry</SelectItem>
                <SelectItem value="ONCOLOGY">Oncology</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={acceptingPatients === "" ? "" : acceptingPatients.toString()}
              onValueChange={handleAcceptingPatientsChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Accepting Patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Accepting</SelectItem>
                <SelectItem value="false">Not Accepting</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Specialization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No doctors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    doctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-sm text-gray-500">
                              {doctor.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{doctor.phone}</p>
                            {doctor.doctorProfile?.experience && (
                              <p className="text-sm text-gray-500">
                                {doctor.doctorProfile.experience} years experience
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{doctor.specialization.replace(/_/g, " ")}</p>
                            {doctor.doctorProfile?.qualifications && (
                              <p className="text-sm text-gray-500">
                                {doctor.doctorProfile.qualifications}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              doctor.doctorProfile?.acceptingPatients
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doctor.doctorProfile?.acceptingPatients
                              ? "Accepting Patients"
                              : "Not Accepting Patients"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/doctors/${doctor.id}`}>
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