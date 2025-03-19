"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Appointment {
  id: string
  date: string
  time: string
  patientName: string
  reason: string
  status: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments")
        const data = await response.json()
        setAppointments(data)
      } catch (error) {
        console.error("Error fetching appointments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "SCHEDULED")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name}</h1>
        <p className="text-gray-500">Here's what's happening with your appointments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(appointments.map((apt) => apt.patientEmail)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button asChild>
              <Link href="/appointments/schedule">Schedule Appointment</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{appointment.patientName}</p>
                    <p className="text-sm text-gray-500">{appointment.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {format(new Date(appointment.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">{appointment.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No upcoming appointments</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 