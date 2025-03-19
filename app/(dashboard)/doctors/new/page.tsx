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

const doctorFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialization: z.enum([
    "GENERAL_PRACTICE",
    "PEDIATRICS",
    "CARDIOLOGY",
    "DERMATOLOGY",
    "NEUROLOGY",
    "ORTHOPEDICS",
    "PSYCHIATRY",
    "ONCOLOGY",
  ]),
  qualifications: z.string().min(2, "Please specify qualifications"),
  experience: z.string().min(1, "Please specify years of experience"),
  bio: z.string().optional(),
  languages: z.string().optional(),
  acceptingPatients: z.boolean().default(true),
  availability: z.array(
    z.object({
      dayOfWeek: z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
})

type DoctorFormValues = z.infer<typeof doctorFormSchema>

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const

export default function NewDoctorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "GENERAL_PRACTICE",
      qualifications: "",
      experience: "",
      bio: "",
      languages: "",
      acceptingPatients: true,
      availability: DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      })),
    },
  })

  const onSubmit = async (data: DoctorFormValues) => {
    if (session?.user.role !== "ADMIN") {
      toast.error("Unauthorized")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          doctorProfile: {
            qualifications: data.qualifications,
            experience: data.experience,
            bio: data.bio || null,
            languages: data.languages ? data.languages.split(",").map(l => l.trim()) : null,
            acceptingPatients: data.acceptingPatients,
          },
          availability: data.availability.filter(
            (slot) => slot.startTime && slot.endTime
          ),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create doctor")
      }

      const doctor = await response.json()
      toast.success("Doctor created successfully")
      router.push(`/doctors/${doctor.id}`)
    } catch (error) {
      console.error("Error creating doctor:", error)
      toast.error("Failed to create doctor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Doctor</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GENERAL_PRACTICE">
                          General Practice
                        </SelectItem>
                        <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                        <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                        <SelectItem value="DERMATOLOGY">Dermatology</SelectItem>
                        <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                        <SelectItem value="ORTHOPEDICS">Orthopedics</SelectItem>
                        <SelectItem value="PSYCHIATRY">Psychiatry</SelectItem>
                        <SelectItem value="ONCOLOGY">Oncology</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="English, Spanish, French" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={day} className="grid gap-4 md:grid-cols-3">
                    <div className="font-medium">{day.charAt(0) + day.slice(1).toLowerCase()}</div>
                    <FormField
                      control={form.control}
                      name={`availability.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`availability.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
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
              {loading ? "Creating..." : "Create Doctor"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 