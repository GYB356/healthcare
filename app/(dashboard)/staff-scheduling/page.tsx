"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Users,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  ClipboardList
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, isSameDay } from "date-fns";
import { toast } from "react-hot-toast";

// Types
interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  image?: string;
  color: string;
  availability?: {
    [key: string]: boolean[][]; // [day][hour] -> available
  };
}

interface Department {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  staffImage?: string;
  staffColor: string;
  department: string;
  date: Date;
  startTime: string; // format: "HH:MM"
  endTime: string; // format: "HH:MM"
  status: "scheduled" | "in-progress" | "completed" | "canceled";
  notes?: string;
}

export default function StaffSchedulingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftDetailsDialog, setShowShiftDetailsDialog] = useState(false);
  
  // New shift form state
  const [newShift, setNewShift] = useState({
    staffId: "",
    department: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00",
    notes: ""
  });
  
  // Time slots for the schedule
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  
  // Check authenticated user
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);
  
  // Load scheduling data
  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock staff data
        const mockStaffMembers: StaffMember[] = [
          { 
            id: "staff1", 
            name: "Dr. Sarah Johnson", 
            role: "Doctor", 
            department: "Primary Care", 
            color: "#4f46e5"
          },
          { 
            id: "staff2", 
            name: "Dr. Michael Chen", 
            role: "Doctor", 
            department: "Cardiology", 
            color: "#0891b2"
          },
          { 
            id: "staff3", 
            name: "Emma Rodriguez", 
            role: "Nurse", 
            department: "Primary Care", 
            color: "#16a34a"
          },
          { 
            id: "staff4", 
            name: "James Wilson", 
            role: "Nurse", 
            department: "Pediatrics", 
            color: "#ca8a04"
          },
          { 
            id: "staff5", 
            name: "Dr. Lisa Kim", 
            role: "Doctor", 
            department: "Pediatrics", 
            color: "#e11d48"
          },
          { 
            id: "staff6", 
            name: "Robert Brown", 
            role: "Technician", 
            department: "Radiology", 
            color: "#7c3aed"
          },
          { 
            id: "staff7", 
            name: "Amanda White", 
            role: "Receptionist", 
            department: "Administration", 
            color: "#f97316"
          },
        ];
        
        // Mock departments data
        const mockDepartments: Department[] = [
          { id: "dept1", name: "Primary Care" },
          { id: "dept2", name: "Cardiology" },
          { id: "dept3", name: "Pediatrics" },
          { id: "dept4", name: "Radiology" },
          { id: "dept5", name: "Administration" },
        ];
        
        // Generate mock shifts
        const today = new Date();
        const startDate = startOfWeek(today, { weekStartsOn: 0 });
        const endDate = endOfWeek(today, { weekStartsOn: 0 });
        
        const mockShifts: Shift[] = [
          {
            id: "shift1",
            staffId: "staff1",
            staffName: "Dr. Sarah Johnson",
            staffRole: "Doctor",
            staffColor: "#4f46e5",
            department: "Primary Care",
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            startTime: "09:00",
            endTime: "17:00",
            status: "scheduled"
          },
          {
            id: "shift2",
            staffId: "staff3",
            staffName: "Emma Rodriguez",
            staffRole: "Nurse",
            staffColor: "#16a34a",
            department: "Primary Care",
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            startTime: "08:00",
            endTime: "16:00",
            status: "scheduled"
          },
          {
            id: "shift3",
            staffId: "staff2",
            staffName: "Dr. Michael Chen",
            staffRole: "Doctor",
            staffColor: "#0891b2",
            department: "Cardiology",
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            startTime: "10:00",
            endTime: "18:00",
            status: "scheduled"
          },
          {
            id: "shift4",
            staffId: "staff4",
            staffName: "James Wilson",
            staffRole: "Nurse",
            staffColor: "#ca8a04",
            department: "Pediatrics",
            date: addDays(today, 1),
            startTime: "09:00",
            endTime: "17:00",
            status: "scheduled"
          },
          {
            id: "shift5",
            staffId: "staff5",
            staffName: "Dr. Lisa Kim",
            staffRole: "Doctor",
            staffColor: "#e11d48",
            department: "Pediatrics",
            date: addDays(today, 1),
            startTime: "08:00",
            endTime: "16:00",
            status: "scheduled"
          },
          {
            id: "shift6",
            staffId: "staff1",
            staffName: "Dr. Sarah Johnson",
            staffRole: "Doctor",
            staffColor: "#4f46e5",
            department: "Primary Care",
            date: addDays(today, 2),
            startTime: "09:00",
            endTime: "17:00",
            status: "scheduled"
          },
          {
            id: "shift7",
            staffId: "staff6",
            staffName: "Robert Brown",
            staffRole: "Technician",
            staffColor: "#7c3aed",
            department: "Radiology",
            date: addDays(today, 2),
            startTime: "10:00",
            endTime: "18:00",
            status: "scheduled"
          },
          {
            id: "shift8",
            staffId: "staff7",
            staffName: "Amanda White",
            staffRole: "Receptionist",
            staffColor: "#f97316",
            department: "Administration",
            date: addDays(today, 3),
            startTime: "08:00",
            endTime: "16:00",
            status: "scheduled"
          },
          {
            id: "shift9",
            staffId: "staff2",
            staffName: "Dr. Michael Chen",
            staffRole: "Doctor",
            staffColor: "#0891b2",
            department: "Cardiology",
            date: addDays(today, 3),
            startTime: "09:00",
            endTime: "17:00",
            status: "scheduled"
          },
          {
            id: "shift10",
            staffId: "staff3",
            staffName: "Emma Rodriguez",
            staffRole: "Nurse",
            staffColor: "#16a34a",
            department: "Primary Care",
            date: addDays(today, 4),
            startTime: "08:00",
            endTime: "16:00",
            status: "scheduled"
          },
        ];
        
        setStaffMembers(mockStaffMembers);
        setDepartments(mockDepartments);
        setShifts(mockShifts);
        setFilteredShifts(mockShifts);
        setLoading(false);
      }, 1000);
    }
  }, [session]);
  
  // Filter shifts when department or staff filter changes
  useEffect(() => {
    let filtered = shifts;
    
    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(shift => shift.department === departmentFilter);
    }
    
    // Apply staff filter
    if (staffFilter) {
      filtered = filtered.filter(shift => shift.staffId === staffFilter);
    }
    
    setFilteredShifts(filtered);
  }, [departmentFilter, staffFilter, shifts]);
  
  // Format time string (e.g., "09:00" -> "9:00 AM")
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${period}`;
  };
  
  // Get shifts for a specific day
  const getShiftsForDay = (date: Date) => {
    return filteredShifts.filter(shift => 
      isSameDay(shift.date, date)
    );
  };
  
  // Get time slot range for a shift
  const getShiftTimeSlotRange = (shift: Shift) => {
    const startHour = parseInt(shift.startTime.split(":")[0], 10);
    const endHour = parseInt(shift.endTime.split(":")[0], 10);
    return {
      start: startHour - 8, // Adjust for 8 AM start
      end: endHour - 8, // Adjust for 8 AM start
    };
  };
  
  // Navigate to previous period
  const goToPreviousPeriod = () => {
    if (currentView === "day") {
      setCurrentDate(prevDate => addDays(prevDate, -1));
    } else if (currentView === "week") {
      setCurrentDate(prevDate => addDays(prevDate, -7));
    } else if (currentView === "month") {
      setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
    }
  };
  
  // Navigate to next period
  const goToNextPeriod = () => {
    if (currentView === "day") {
      setCurrentDate(prevDate => addDays(prevDate, 1));
    } else if (currentView === "week") {
      setCurrentDate(prevDate => addDays(prevDate, 7));
    } else if (currentView === "month") {
      setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
    }
  };
  
  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle create shift
  const handleCreateShift = () => {
    // Validate form
    if (!newShift.staffId || !newShift.department || !newShift.date || !newShift.startTime || !newShift.endTime) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const startHour = parseInt(newShift.startTime.split(":")[0], 10);
    const endHour = parseInt(newShift.endTime.split(":")[0], 10);
    
    if (startHour >= endHour) {
      toast.error("End time must be after start time");
      return;
    }
    
    // Find the staff member
    const staff = staffMembers.find(s => s.id === newShift.staffId);
    if (!staff) {
      toast.error("Invalid staff selection");
      return;
    }
    
    // Create new shift
    const newShiftData: Shift = {
      id: `shift-${Date.now()}`,
      staffId: newShift.staffId,
      staffName: staff.name,
      staffRole: staff.role,
      staffColor: staff.color,
      department: newShift.department,
      date: new Date(newShift.date),
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      status: "scheduled",
      notes: newShift.notes || undefined
    };
    
    // Add to shifts list
    setShifts(prevShifts => [...prevShifts, newShiftData]);
    
    // Reset form and close dialog
    setNewShift({
      staffId: "",
      department: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      notes: ""
    });
    setShowAddShiftDialog(false);
    
    // Show success message
    toast.success("Shift scheduled successfully");
  };
  
  // Handle view shift details
  const handleViewShiftDetails = (shift: Shift) => {
    setSelectedShift(shift);
    setShowShiftDetailsDialog(true);
  };
  
  // Handle delete shift
  const handleDeleteShift = (shiftId: string) => {
    setShifts(prevShifts => prevShifts.filter(shift => shift.id !== shiftId));
    setShowShiftDetailsDialog(false);
    toast.success("Shift deleted successfully");
  };
  
  // Get the days of the current week
  const daysOfWeek = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center h-72">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Scheduling</h1>
          <p className="text-gray-600">
            Manage and view staff schedules and shifts
          </p>
        </div>
        
        {/* Add shift button */}
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setShowAddShiftDialog(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Schedule Shift
          </Button>
        </div>
      </div>

      {/* Calendar navigation and filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousPeriod}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextPeriod}>
            <ChevronRight size={16} />
          </Button>
          <div className="text-lg font-medium ml-2">
            {currentView === "day" && format(currentDate, "MMMM d, yyyy")}
            {currentView === "week" && (
              <>
                {format(daysOfWeek[0], "MMM d")} - {format(daysOfWeek[6], "MMM d, yyyy")}
              </>
            )}
            {currentView === "month" && format(currentDate, "MMMM yyyy")}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <Select
            value={departmentFilter || ""}
            onValueChange={(value) => setDepartmentFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={staffFilter || ""}
            onValueChange={(value) => setStaffFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Staff</SelectItem>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs defaultValue="week" className="w-[300px]" onValueChange={(value) => setCurrentView(value as "day" | "week" | "month")}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Weekly View */}
      {currentView === "week" && (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="py-2 px-3 text-sm font-medium text-gray-500 border-r"></div>
            {daysOfWeek.map((day, index) => (
              <div 
                key={index} 
                className={`py-2 px-3 text-center font-medium border-r ${
                  isToday(day) ? "bg-blue-50 text-blue-600" : ""
                }`}
              >
                <div className="text-xs text-gray-500">{format(day, "EEE")}</div>
                <div className={`text-sm ${isToday(day) ? "text-blue-600" : ""}`}>{format(day, "d")}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="relative min-h-[600px]">
            {timeSlots.map((hour, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-8 border-b">
                <div className="py-2 px-3 text-sm text-gray-500 font-medium border-r">
                  {`${hour}:00`}
                </div>
                {daysOfWeek.map((day, colIndex) => {
                  const shiftsForThisDay = getShiftsForDay(day);
                  
                  return (
                    <div 
                      key={colIndex} 
                      className={`relative py-2 px-1 border-r h-16 ${
                        isToday(day) ? "bg-blue-50" : ""
                      }`}
                    >
                      {shiftsForThisDay.map(shift => {
                        const timeRange = getShiftTimeSlotRange(shift);
                        // Only render shifts that start at this hour
                        if (timeRange.start === rowIndex) {
                          const durationInHours = timeRange.end - timeRange.start;
                          return (
                            <div
                              key={shift.id}
                              className="absolute left-0 right-0 mx-1 rounded-md p-1 text-xs text-white cursor-pointer overflow-hidden"
                              style={{
                                backgroundColor: shift.staffColor,
                                top: "0.25rem",
                                height: `${durationInHours * 4 - 0.5}rem`,
                                zIndex: 10
                              }}
                              onClick={() => handleViewShiftDetails(shift)}
                            >
                              <div className="font-medium truncate">{shift.staffName}</div>
                              <div className="truncate">{shift.staffRole}</div>
                              <div className="truncate text-xs opacity-90">
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Day View */}
      {currentView === "day" && (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-1">
            <div className="py-3 px-4 bg-gray-50 border-b">
              <h3 className="text-lg font-medium">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {timeSlots.map((hour, index) => {
                  const shiftsAtThisHour = filteredShifts.filter(shift => {
                    if (!isSameDay(shift.date, currentDate)) return false;
                    const startHour = parseInt(shift.startTime.split(":")[0], 10);
                    const endHour = parseInt(shift.endTime.split(":")[0], 10);
                    return hour >= startHour && hour < endHour;
                  });
                  
                  return (
                    <div key={index} className="flex">
                      <div className="w-20 py-2 text-sm text-gray-500 font-medium">
                        {`${hour}:00`}
                      </div>
                      <div className="flex-1 border-l pl-4">
                        {shiftsAtThisHour.length > 0 ? (
                          <div className="space-y-2">
                            {shiftsAtThisHour.map(shift => (
                              <div
                                key={shift.id}
                                className="flex items-start gap-3 p-2 rounded-md cursor-pointer"
                                style={{ backgroundColor: `${shift.staffColor}20` }}
                                onClick={() => handleViewShiftDetails(shift)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback style={{ backgroundColor: shift.staffColor }}>
                                    {shift.staffName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{shift.staffName}</div>
                                  <div className="text-sm text-gray-600">{shift.staffRole} • {shift.department}</div>
                                  <div className="text-sm text-gray-600">
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-8 flex items-center text-gray-400 text-sm">
                            No shifts scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Month View */}
      {currentView === "month" && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly View Coming Soon</CardTitle>
            <CardDescription>
              The monthly calendar view is under development. Please use day or week view for now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Feature in Development</AlertTitle>
              <AlertDescription>
                The monthly view will provide a comprehensive overview of all staff schedules across the month.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setCurrentView("week")}>Switch to Week View</Button>
          </CardFooter>
        </Card>
      )}

      {/* Staff List */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Staff Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.map((staff) => (
            <div 
              key={staff.id} 
              className="border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-gray-400"
              onClick={() => setStaffFilter(staff.id === staffFilter ? null : staff.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={staff.image} />
                <AvatarFallback style={{ backgroundColor: staff.color }}>
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{staff.name}</div>
                <div className="text-sm text-gray-500">{staff.role}</div>
                <div className="text-sm text-gray-500">{staff.department}</div>
              </div>
              {staff.id === staffFilter && (
                <CheckCircle size={18} className="ml-auto text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={showAddShiftDialog} onOpenChange={setShowAddShiftDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Shift</DialogTitle>
            <DialogDescription>
              Create a new staff shift assignment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="staff">Staff Member *</Label>
              <Select
                value={newShift.staffId}
                onValueChange={(value) => setNewShift({...newShift, staffId: value})}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={newShift.department}
                onValueChange={(value) => setNewShift({...newShift, department: value})}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Shift Date *</Label>
              <Input
                id="date"
                type="date"
                value={newShift.date}
                onChange={(e) => setNewShift({...newShift, date: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Select
                  value={newShift.startTime}
                  onValueChange={(value) => setNewShift({...newShift, startTime: value})}
                >
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Select
                  value={newShift.endTime}
                  onValueChange={(value) => setNewShift({...newShift, endTime: value})}
                >
                  <SelectTrigger id="endTime">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                    <SelectItem value="19:00">7:00 PM</SelectItem>
                    <SelectItem value="20:00">8:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes for this shift"
                value={newShift.notes}
                onChange={(e) => setNewShift({...newShift, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddShiftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShift}>
              Schedule Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Details Dialog */}
      {selectedShift && (
        <Dialog open={showShiftDetailsDialog} onOpenChange={setShowShiftDetailsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Shift Details</DialogTitle>
              <DialogDescription>
                {format(selectedShift.date, "EEEE, MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedShift.staffImage} />
                  <AvatarFallback style={{ backgroundColor: selectedShift.staffColor }}>
                    {selectedShift.staffName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-lg">{selectedShift.staffName}</div>
                  <div className="text-gray-500">{selectedShift.staffRole}</div>
                  <div className="text-gray-500">{selectedShift.department}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex gap-2 items-center">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-gray-700">
                    {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <CalendarIcon size={16} className="text-gray-500" />
                  <span className="text-gray-700">
                    {format(selectedShift.date, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Users size={16} className="text-gray-500" />
                  <span className="text-gray-700">{selectedShift.department}</span>
                </div>
              </div>
              
              {selectedShift.notes && (
                <div>
                  <Label className="text-sm text-gray-500">Notes</Label>
                  <p className="text-gray-700 mt-1">{selectedShift.notes}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="destructive" 
                className="flex items-center gap-1"
                onClick={() => handleDeleteShift(selectedShift.id)}
              >
                <Trash2 size={16} />
                Delete Shift
              </Button>
              <Button onClick={() => setShowShiftDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 