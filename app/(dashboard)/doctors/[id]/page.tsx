"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format } from "date-fns"

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
    bio: string | null
    languages: string[] | null
  } | null
  availability: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
  appointments: Array<{
    id: string
    date: string
    status: string
    reason: string
    patientId: string
    patient: {
      name: string
    }
  }>
}

export default function DoctorProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDoctor()
  }, [params.id])

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/doctors/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch doctor")
      }

      const data = await response.json()
      setDoctor(data)
    } catch (error) {
      console.error("Error fetching doctor:", error)
      toast.error("Failed to load doctor profile")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAcceptingPatients = async () => {
    if (!doctor || !session?.user.role === "ADMIN") return

    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorProfile: {
            ...doctor.doctorProfile,
            acceptingPatients: !doctor.doctorProfile?.acceptingPatients,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update doctor status")
      }

      await fetchDoctor()
      toast.success("Doctor status updated successfully")
    } catch (error) {
      console.error("Error updating doctor status:", error)
      toast.error("Failed to update doctor status")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!doctor) {
    return <div>Doctor not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{doctor.name}</h1>
        <div className="space-x-4">
          {session?.user.role === "ADMIN" && (
            <Button
              variant="outline"
              onClick={handleToggleAcceptingPatients}
            >
              {doctor.doctorProfile?.acceptingPatients
                ? "Stop Accepting Patients"
                : "Start Accepting Patients"}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back to Doctors
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Email</dt>
                    <dd>{doctor.email}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Phone</dt>
                    <dd>{doctor.phone}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Specialization</dt>
                    <dd>{doctor.specialization.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Experience</dt>
                    <dd>
                      {doctor.doctorProfile?.experience
                        ? `${doctor.doctorProfile.experience} years`
                        : "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Qualifications</dt>
                    <dd>
                      {doctor.doctorProfile?.qualifications || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Languages</dt>
                    <dd>
                      {doctor.doctorProfile?.languages?.join(", ") ||
                        "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Status</dt>
                    <dd>
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
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {doctor.doctorProfile?.bio && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{doctor.doctorProfile.bio}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {doctor.availability.length > 0 ? (
                <div className="space-y-4">
                  {doctor.availability
                    .sort((a, b) => {
                      const days = [
                        "MONDAY",
                        "TUESDAY",
                        "WEDNESDAY",
                        "THURSDAY",
                        "FRIDAY",
                        "SATURDAY",
                        "SUNDAY",
                      ]
                      return (
                        days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek)
                      )
                    })
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between border-b pb-4"
                      >
                        <div>
                          <p className="font-medium">
                            {slot.dayOfWeek.charAt(0) +
                              slot.dayOfWeek.slice(1).toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(`2000-01-01T${slot.startTime}`), "h:mm a")} -{" "}
                            {format(new Date(`2000-01-01T${slot.endTime}`), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p>No availability schedule set</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {doctor.appointments.length > 0 ? (
                <div className="space-y-4">
                  {doctor.appointments
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between border-b pb-4"
                      >
                        <div>
                          <p className="font-medium">
                            {format(new Date(appointment.date), "PPP p")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Patient: {appointment.patient.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reason: {appointment.reason}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              appointment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p>No upcoming appointments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 