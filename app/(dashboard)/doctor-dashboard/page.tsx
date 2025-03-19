"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  CalendarDays, 
  FileText, 
  Clock,
  MessageSquare,
  Activity,
  User,
  ChevronRight,
  Search,
  Bell,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Types
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: Date;
  upcomingAppointment?: Date;
  profileImage?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientImage?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  reason: string;
  isNew: boolean;
}

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  type: 'prescription' | 'review' | 'followup' | 'referral';
}

interface DoctorData {
  patients: Patient[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  pendingTasks: Task[];
  totalPatientsToday: number;
  appointmentsCompleted: number;
  unreadMessages: number;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Verify authenticated user
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Check if user is a doctor
    if (session?.user.role !== "doctor" && session?.user.role !== "admin") {
      router.push("/dashboard"); // Redirect to appropriate dashboard
    }
  }, [session, status, router]);

  // Fetch doctor data
  useEffect(() => {
    if (session?.user && (session.user.role === "doctor" || session.user.role === "admin")) {
      // In a real implementation, you would fetch this data from your API
      // For now, we'll use mock data
      setLoading(true);
      
      // Simulate API call with setTimeout
      setTimeout(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const mockDoctorData: DoctorData = {
          patients: [
            {
              id: "pat1",
              name: "John Doe",
              age: 45,
              gender: "Male",
              lastVisit: new Date(2025, 2, 10),
              upcomingAppointment: new Date(2025, 2, 18, 10, 0),
            },
            {
              id: "pat2",
              name: "Sarah Johnson",
              age: 35,
              gender: "Female",
              lastVisit: new Date(2025, 1, 15),
              upcomingAppointment: new Date(2025, 2, 18, 14, 30),
            },
            {
              id: "pat3",
              name: "Robert Chen",
              age: 62,
              gender: "Male",
              lastVisit: new Date(2025, 2, 5),
              upcomingAppointment: new Date(2025, 2, 19, 9, 0),
            },
            {
              id: "pat4",
              name: "Maria Rodriguez",
              age: 28,
              gender: "Female",
              lastVisit: new Date(2025, 0, 20),
              upcomingAppointment: new Date(2025, 2, 25, 11, 30),
            },
            {
              id: "pat5",
              name: "James Wilson",
              age: 57,
              gender: "Male",
              lastVisit: new Date(2025, 2, 12),
            },
          ],
          todayAppointments: [
            {
              id: "app1",
              patientId: "pat1",
              patientName: "John Doe",
              startTime: new Date(today.setHours(9, 0, 0)),
              endTime: new Date(today.setHours(9, 30, 0)),
              status: "completed",
              reason: "Blood pressure follow-up",
              isNew: false,
            },
            {
              id: "app2",
              patientId: "pat2",
              patientName: "Sarah Johnson",
              startTime: new Date(today.setHours(10, 0, 0)),
              endTime: new Date(today.setHours(10, 30, 0)),
              status: "completed",
              reason: "Annual physical",
              isNew: false,
            },
            {
              id: "app3",
              patientId: "pat3",
              patientName: "Robert Chen",
              startTime: new Date(today.setHours(11, 0, 0)),
              endTime: new Date(today.setHours(11, 30, 0)),
              status: "in-progress",
              reason: "Diabetes management",
              isNew: false,
            },
            {
              id: "app4",
              patientId: "pat6",
              patientName: "Emily Thompson",
              startTime: new Date(today.setHours(14, 0, 0)),
              endTime: new Date(today.setHours(14, 30, 0)),
              status: "scheduled",
              reason: "Headache consultation",
              isNew: true,
            },
            {
              id: "app5",
              patientId: "pat7",
              patientName: "David Patel",
              startTime: new Date(today.setHours(15, 0, 0)),
              endTime: new Date(today.setHours(15, 30, 0)),
              status: "scheduled",
              reason: "Chest pain evaluation",
              isNew: false,
            },
          ],
          upcomingAppointments: [
            {
              id: "app6",
              patientId: "pat1",
              patientName: "John Doe",
              startTime: new Date(tomorrow.setHours(10, 0, 0)),
              endTime: new Date(tomorrow.setHours(10, 30, 0)),
              status: "scheduled",
              reason: "Medication review",
              isNew: false,
            },
            {
              id: "app7",
              patientId: "pat4",
              patientName: "Maria Rodriguez",
              startTime: new Date(tomorrow.setHours(11, 0, 0)),
              endTime: new Date(tomorrow.setHours(11, 30, 0)),
              status: "scheduled",
              reason: "Pregnancy check-up",
              isNew: false,
            },
          ],
          pendingTasks: [
            {
              id: "task1",
              title: "Review lab results for Robert Chen",
              dueDate: new Date(today),
              priority: "high",
              status: "pending",
              type: "review",
            },
            {
              id: "task2",
              title: "Refill prescription for Sarah Johnson",
              dueDate: new Date(today),
              priority: "medium",
              status: "pending",
              type: "prescription",
            },
            {
              id: "task3",
              title: "Complete medical record for John Doe",
              dueDate: new Date(tomorrow),
              priority: "medium",
              status: "pending",
              type: "review",
            },
            {
              id: "task4",
              title: "Follow up with Maria Rodriguez about test results",
              dueDate: new Date(tomorrow),
              priority: "high",
              status: "pending",
              type: "followup",
            },
          ],
          totalPatientsToday: 5,
          appointmentsCompleted: 2,
          unreadMessages: 3,
        };
        
        setDoctorData(mockDoctorData);
        setLoading(false);
      }, 1000);
    }
  }, [session]);

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter patients by search term
  const filteredPatients = doctorData?.patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Loading state
  if (loading || !doctorData) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center h-72">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate completion percentage
  const completionPercentage = Math.round((doctorData.appointmentsCompleted / doctorData.totalPatientsToday) * 100);

  // Get next appointment
  const getNextAppointment = () => {
    const now = new Date();
    return doctorData.todayAppointments.find(
      appointment => appointment.status === "scheduled" && new Date(appointment.startTime) > now
    );
  };

  const nextAppointment = getNextAppointment();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, Dr. {session?.user.name?.split(' ')[0]}</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="relative">
            <Bell size={20} />
            {doctorData.unreadMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-2" variant="destructive">
                {doctorData.unreadMessages}
              </Badge>
            )}
          </Button>
          <Avatar>
            <AvatarImage src={session?.user.image || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {session?.user.name?.substring(0, 2).toUpperCase() || "DR"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Patients</p>
                <h3 className="text-3xl font-bold">{doctorData.totalPatientsToday}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center text-sm mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                <h3 className="text-3xl font-bold">{doctorData.pendingTasks.length}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              {doctorData.pendingTasks.slice(0, 2).map(task => (
                <div key={task.id} className="text-sm truncate text-gray-600">
                  • {task.title}
                </div>
              ))}
              {doctorData.pendingTasks.length > 2 && (
                <Button variant="ghost" size="sm" className="px-0 text-sm h-auto py-0 hover:bg-transparent" onClick={() => router.push("/tasks")}>
                  See all tasks...
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                <h3 className="text-3xl font-bold">{doctorData.unreadMessages}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button className="w-full" size="sm" variant="outline" onClick={() => router.push("/messages")}>
                View Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Card (if exists) */}
      {nextAppointment && (
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Next Appointment</p>
                <h3 className="text-xl font-bold mt-1">{nextAppointment.patientName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={nextAppointment.isNew ? "destructive" : "outline"}>
                    {nextAppointment.isNew ? "New Patient" : "Returning Patient"}
                  </Badge>
                  <p className="text-sm text-gray-500">{nextAppointment.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{formatTime(nextAppointment.startTime)}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(nextAppointment.startTime)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push(`/medical-records?patientId=${nextAppointment.patientId}`)}>
                View Records
              </Button>
              <Button size="sm" onClick={() => router.push(`/appointments/${nextAppointment.id}`)}>
                Start Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Schedule */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="today">Today's Schedule</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>
                    You have {doctorData.todayAppointments.length} appointments scheduled for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {doctorData.todayAppointments.map(appointment => (
                      <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={appointment.patientImage || ""} />
                            <AvatarFallback className="bg-gray-200">
                              {appointment.patientName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {appointment.patientName}
                              {appointment.isNew && (
                                <Badge className="ml-2" variant="outline">New</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{appointment.reason}</div>
                            <div className="text-sm text-gray-500">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.status === "completed" ? (
                            <Badge className="flex items-center gap-1" variant="success">
                              <CheckCircle size={12} />
                              Completed
                            </Badge>
                          ) : appointment.status === "in-progress" ? (
                            <Badge className="flex items-center gap-1" variant="secondary">
                              <Activity size={12} />
                              In Progress
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => router.push(`/appointments/${appointment.id}`)}>
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/appointments/schedule")}>
                    Manage Schedule
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="upcoming">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>
                    Your scheduled appointments for the next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {doctorData.upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {doctorData.upcomingAppointments.map(appointment => (
                        <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={appointment.patientImage || ""} />
                              <AvatarFallback className="bg-gray-200">
                                {appointment.patientName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{appointment.patientName}</div>
                              <div className="text-sm text-gray-500">{appointment.reason}</div>
                              <div className="text-sm text-gray-500">
                                {formatDate(appointment.startTime)}, {formatTime(appointment.startTime)}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/appointments/${appointment.id}`)}>
                            Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No upcoming appointments scheduled.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/appointments")}>
                    View All Appointments
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Tasks Section */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>
                    Tasks that require your attention
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {doctorData.pendingTasks.map(task => (
                  <div key={task.id} className="flex items-start justify-between border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{task.title}</div>
                        {task.priority === "high" && (
                          <Badge variant="destructive">High Priority</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Due: {formatDate(task.dueDate)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Complete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Patient List */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>My Patients</CardTitle>
              <CardDescription>
                Quick access to patient records
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search patients..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-3">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50 rounded-md p-2"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={patient.profileImage || ""} />
                          <AvatarFallback className="bg-gray-200">
                            {patient.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.age} years, {patient.gender}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last visit: {formatDate(patient.lastVisit)}
                          </div>
                        </div>
                      </div>
                      {patient.upcomingAppointment && (
                        <Badge variant="outline" className="whitespace-nowrap">
                          Upcoming: {formatDate(patient.upcomingAppointment)}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No patients found.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full flex items-center justify-between" onClick={() => router.push("/patients")}>
                <span>View All Patients</span>
                <ChevronRight size={16} />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 