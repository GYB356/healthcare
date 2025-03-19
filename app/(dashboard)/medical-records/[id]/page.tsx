"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { Download } from "lucide-react"

interface MedicalRecord {
  id: string
  date: string
  type: string
  description: string
  patientId: string
  patient: {
    name: string
    dateOfBirth: string
    email: string
    phone: string
    patientProfile: {
      bloodType: string | null
      allergies: string | null
      medications: string | null
      chronicConditions: string | null
    } | null
  }
  doctorId: string
  doctor: {
    name: string
    specialization: string
  }
  attachments: Array<{
    id: string
    name: string
    type: string
    url: string
  }>
}

export default function MedicalRecordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      router.push("/login")
      return
    }

    fetchRecord()
  }, [session, router, params.id])

  const fetchRecord = async () => {
    try {
      const response = await fetch(`/api/medical-records/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch medical record")
      }

      const data = await response.json()
      setRecord(data)
    } catch (error) {
      console.error("Error fetching medical record:", error)
      toast.error("Failed to load medical record")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/medical-records/${params.id}/attachments/${attachmentId}`)
      if (!response.ok) {
        throw new Error("Failed to download attachment")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading attachment:", error)
      toast.error("Failed to download attachment")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!record) {
    return <div>Medical record not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Medical Record Details</h1>
        <div className="space-x-4">
          {session?.user.role === "DOCTOR" && (
            <Button
              variant="outline"
              onClick={() => router.push(`/medical-records/${record.id}/edit`)}
            >
              Edit Record
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back to Records
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">Date</dt>
                <dd>{format(new Date(record.date), "PPP")}</dd>
              </div>
              <div>
                <dt className="font-medium">Type</dt>
                <dd>{record.type.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="font-medium">Doctor</dt>
                <dd>
                  {record.doctor.name} ({record.doctor.specialization.replace(/_/g, " ")})
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">Name</dt>
                <dd>{record.patient.name}</dd>
              </div>
              <div>
                <dt className="font-medium">Date of Birth</dt>
                <dd>{format(new Date(record.patient.dateOfBirth), "PP")}</dd>
              </div>
              <div>
                <dt className="font-medium">Contact</dt>
                <dd>
                  {record.patient.email}
                  <br />
                  {record.patient.phone}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Medical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="mt-1 whitespace-pre-wrap">{record.description}</p>
              </div>

              {record.patient.patientProfile && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium">Patient Medical History</h3>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-gray-500">Blood Type</dt>
                      <dd>{record.patient.patientProfile.bloodType || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Allergies</dt>
                      <dd>{record.patient.patientProfile.allergies || "None reported"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Current Medications</dt>
                      <dd>{record.patient.patientProfile.medications || "None reported"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Chronic Conditions</dt>
                      <dd>
                        {record.patient.patientProfile.chronicConditions || "None reported"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {record.attachments.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {record.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{attachment.name}</p>
                      <p className="text-sm text-gray-500">{attachment.type}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(attachment.id, attachment.name)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 