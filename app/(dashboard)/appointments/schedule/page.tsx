"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { toast } from "sonner"

interface TimeSlot {
  time: string
  available: boolean
}

export default function ScheduleAppointment() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [reason, setReason] = useState("")
  const [duration, setDuration] = useState("30")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date)
    }
  }, [date])

  const fetchAvailableSlots = async (selectedDate: Date) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/available-slots?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      const data = await response.json()
      
      if (response.ok) {
        setAvailableSlots(data.slots)
        setError("")
      } else {
        setError(data.error || "Failed to fetch available slots")
      }
    } catch (err) {
      setError("Failed to fetch available time slots")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(date!, 'yyyy-MM-dd'),
          time: selectedTime,
          patientName,
          patientEmail,
          reason,
          duration: parseInt(duration),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Appointment scheduled successfully!")
        router.push('/dashboard')
      } else {
        setError(data.error || "Failed to schedule appointment")
        toast.error(data.error || "Failed to schedule appointment")
      }
    } catch (err) {
      setError("Failed to schedule appointment")
      toast.error("Failed to schedule appointment")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!date) {
      toast.error("Please select a date")
      return false
    }
    if (!selectedTime) {
      toast.error("Please select a time slot")
      return false
    }
    if (!patientName.trim()) {
      toast.error("Please enter patient name")
      return false
    }
    if (!patientEmail.trim()) {
      toast.error("Please enter patient email")
      return false
    }
    if (!reason.trim()) {
      toast.error("Please enter appointment reason")
      return false
    }
    return true
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  />
                </div>

                <div>
                  <Label>Available Time Slots</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {loading ? (
                      <p>Loading available slots...</p>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className="w-full"
                        >
                          {slot.time}
                        </Button>
                      ))
                    ) : (
                      <p>No available slots for selected date</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>

                <div>
                  <Label htmlFor="patientEmail">Patient Email</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="Enter patient email"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for visit"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 