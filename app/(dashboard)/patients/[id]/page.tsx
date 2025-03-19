"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format } from "date-fns"

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
  appointments: Array<{
    id: string
    date: string
    status: string
    reason: string
    doctorId: string
    doctor: {
      name: string
    }
  }>
  medicalRecords: Array<{
    id: string
    date: string
    type: string
    description: string
    doctorId: string
    doctor: {
      name: string
    }
  }>
}

export default function PatientProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.role !== "DOCTOR") {
      router.push("/dashboard")
      return
    }

    fetchPatient()
  }, [session, router, params.id])

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch patient")
      }

      const data = await response.json()
      setPatient(data)
    } catch (error) {
      console.error("Error fetching patient:", error)
      toast.error("Failed to load patient profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!patient) {
    return <div>Patient not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{patient.name}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Patients
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Email</dt>
                    <dd>{patient.email}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Phone</dt>
                    <dd>{patient.phone}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Date of Birth</dt>
                    <dd>
                      {patient.dateOfBirth &&
                        format(new Date(patient.dateOfBirth), "PPP")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Gender</dt>
                    <dd>{patient.gender}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Blood Type</dt>
                    <dd>{patient.patientProfile?.bloodType || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Allergies</dt>
                    <dd>{patient.patientProfile?.allergies || "None reported"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Medications</dt>
                    <dd>
                      {patient.patientProfile?.medications || "None reported"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Chronic Conditions</dt>
                    <dd>
                      {patient.patientProfile?.chronicConditions ||
                        "None reported"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.emergencyContact ? (
                  <dl className="space-y-2">
                    <div>
                      <dt className="font-medium">Name</dt>
                      <dd>{patient.emergencyContact.name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Relationship</dt>
                      <dd>{patient.emergencyContact.relationship}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Phone</dt>
                      <dd>{patient.emergencyContact.phone}</dd>
                    </div>
                  </dl>
                ) : (
                  <p>No emergency contact information provided</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.insurance ? (
                  <dl className="space-y-2">
                    <div>
                      <dt className="font-medium">Provider</dt>
                      <dd>{patient.insurance.provider}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Policy Number</dt>
                      <dd>{patient.insurance.policyNumber}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Expiration Date</dt>
                      <dd>
                        {format(
                          new Date(patient.insurance.expirationDate),
                          "PPP"
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p>No insurance information provided</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.appointments.length > 0 ? (
                <div className="space-y-4">
                  {patient.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(appointment.date), "PPP p")}
                        </p>
                        <p className="text-sm text-gray-500">
                          Doctor: {appointment.doctor.name}
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
                <p>No appointments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical-records">
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalRecords.length > 0 ? (
                <div className="space-y-4">
                  {patient.medicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(record.date), "PPP")}
                        </p>
                        <p className="text-sm text-gray-500">
                          Type: {record.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          Doctor: {record.doctor.name}
                        </p>
                        <p className="mt-1">{record.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No medical records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 