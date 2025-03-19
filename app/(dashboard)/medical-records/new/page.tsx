"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const recordFormSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  type: z.enum([
    "CONSULTATION",
    "DIAGNOSIS",
    "TREATMENT",
    "PRESCRIPTION",
    "LAB_RESULT",
    "IMAGING",
    "SURGERY",
    "FOLLOW_UP",
  ]),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  description: z.string().min(1, "Description is required"),
  attachments: z
    .array(
      z.object({
        file: z.instanceof(File).refine(
          (file) => file.size <= MAX_FILE_SIZE,
          `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
        ).refine(
          (file) => ACCEPTED_FILE_TYPES.includes(file.type),
          "Invalid file type"
        ),
      })
    )
    .optional(),
})

type RecordFormValues = z.infer<typeof recordFormSchema>

interface Patient {
  id: string
  name: string
  dateOfBirth: string
}

export default function NewMedicalRecordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      patientId: "",
      type: "CONSULTATION",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      description: "",
      attachments: [],
    },
  })

  const searchPatients = async (query: string) => {
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Failed to search patients")
      }

      const data = await response.json()
      setPatients(data)
    } catch (error) {
      console.error("Error searching patients:", error)
      toast.error("Failed to search patients")
    }
  }

  const onSubmit = async (data: RecordFormValues) => {
    if (!session?.user.role === "DOCTOR") {
      toast.error("Unauthorized")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("patientId", data.patientId)
      formData.append("type", data.type)
      formData.append("date", data.date)
      formData.append("description", data.description)

      if (data.attachments) {
        data.attachments.forEach((attachment, index) => {
          formData.append(`attachments`, attachment.file)
        })
      }

      const response = await fetch("/api/medical-records", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to create medical record")
      }

      const record = await response.json()
      toast.success("Medical record created successfully")
      router.push(`/medical-records/${record.id}`)
    } catch (error) {
      console.error("Error creating medical record:", error)
      toast.error("Failed to create medical record")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const currentAttachments = form.getValues("attachments") || []

    const newAttachments = files.map((file) => ({ file }))
    form.setValue("attachments", [...currentAttachments, ...newAttachments])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Medical Record</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Record Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search patients..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            searchPatients(e.target.value)
                          }}
                        />
                        {patients.length > 0 && (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              setSearchQuery(
                                patients.find((p) => p.id === value)?.name || ""
                              )
                              setPatients([])
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name} (DOB:{" "}
                                  {format(new Date(patient.dateOfBirth), "PP")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CONSULTATION">Consultation</SelectItem>
                          <SelectItem value="DIAGNOSIS">Diagnosis</SelectItem>
                          <SelectItem value="TREATMENT">Treatment</SelectItem>
                          <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                          <SelectItem value="LAB_RESULT">Lab Result</SelectItem>
                          <SelectItem value="IMAGING">Imaging</SelectItem>
                          <SelectItem value="SURGERY">Surgery</SelectItem>
                          <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date and Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachments</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          accept={ACCEPTED_FILE_TYPES.join(",")}
                          onChange={handleFileChange}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {field.value.map((attachment, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-500"
                            >
                              {attachment.file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Record"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 