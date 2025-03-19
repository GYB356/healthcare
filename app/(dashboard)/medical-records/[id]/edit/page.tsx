"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Upload, X, ArrowLeft } from "lucide-react"

const formSchema = z.object({
  recordType: z.string().min(1, "Record type is required"),
  description: z.string().min(1, "Description is required"),
})

const recordTypes = [
  "Consultation",
  "Lab Result",
  "Prescription",
  "Imaging",
  "Surgery",
  "Vaccination",
  "Other",
]

interface MedicalRecord {
  id: string
  patientName: string
  patientEmail: string
  doctorName: string
  recordType: string
  date: string
  description: string
  attachments: {
    id: string
    name: string
    url: string
  }[]
}

export default function EditMedicalRecordPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<
    MedicalRecord["attachments"]
  >([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recordType: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/medical-records/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch record")
        }
        const data = await response.json()
        setRecord(data)
        setExistingAttachments(data.attachments)
        form.reset({
          recordType: data.recordType,
          description: data.description,
        })
      } catch (error) {
        console.error("Error fetching medical record:", error)
        toast.error("Failed to load medical record")
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [params.id, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // First, upload any new files
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload file")
          }

          const data = await response.json()
          return {
            name: file.name,
            url: data.url,
          }
        })
      )

      // Then update the medical record with both existing and new attachments
      const response = await fetch(`/api/medical-records/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          attachments: [...existingAttachments, ...uploadedFiles],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update medical record")
      }

      toast.success("Medical record updated successfully")
      router.push(`/medical-records/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating medical record:", error)
      toast.error("Failed to update medical record")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingAttachment = (id: string) => {
    setExistingAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!record) {
    return <div>Record not found</div>
  }

  if (session?.user.role !== "DOCTOR") {
    return <div>Unauthorized</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Medical Record</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="recordType"
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
                        {recordTypes.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Textarea
                        placeholder="Enter record details..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Attachments</FormLabel>
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm truncate">{attachment.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingAttachment(attachment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                Update Record
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 