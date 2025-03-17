import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash, 
  Clock, 
  Calendar, 
  Tag, 
  DollarSign,
  BarChart
} from 'lucide-react';
import _ from 'lodash';

// Mock data for demonstration
const mockProjects = [
  { id: '1', name: 'Website Redesign' },
  { id: '2', name: 'Mobile App Development' },
  { id: '3', name: 'CRM Integration' }
];

const mockTasks = [
  { id: '1', name: 'Design Homepage', projectId: '1' },
  { id: '2', name: 'Develop API', projectId: '1' },
  { id: '3', name: 'User Testing', projectId: '1' },
  { id: '4', name: 'iOS Development', projectId: '2' },
  { id: '5', name: 'Android Development', projectId: '2' },
  { id: '6', name: 'Database Integration', projectId: '3' }
];

const mockTimeEntries = [
  { 
    id: '1',
    taskId: '1',
    projectId: '1',
    description: 'Working on wireframes',
    startTime: new Date(2025, 2, 10, 9, 0),
    endTime: new Date(2025, 2, 10, 12, 30),
    duration: 12600,
    billable: true,
    tags: ['design', 'wireframe']
  },
  { 
    id: '2',
    taskId: '2',
    projectId: '1',
    description: 'Setting up API endpoints',
    startTime: new Date(2025, 2, 10, 13, 30),
    endTime: new Date(2025, 2, 10, 16, 45),
    duration: 11700,
    billable: true,
    tags: ['development', 'backend']
  },
  { 
    id: '3',
    taskId: '4',
    projectId: '2',
    description: 'iOS UI implementation',
    startTime: new Date(2025, 2, 9, 10, 0),
    endTime: new Date(2025, 2, 9, 15, 30),
    duration: 19800,
    billable: true,
    tags: ['development', 'mobile']
  }
];

const TimeTracker = () => {
  // State for the timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimerId, setCurrentTimerId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [tags, setTags] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState(mockTimeEntries);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('timer');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [timeDiff, setTimeDiff] = useState(0);
  
  // Timer interval reference
  const timerIntervalRef = useRef(null);
  const timerStartTimeRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Format time in HH:MM:SS format
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format duration in a readable format (e.g., 3h 45m)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Filter tasks based on selected project
  useEffect(() => {
    if (selectedProject) {
      const filtered = mockTasks.filter(task => task.projectId === selectedProject);
      setFilteredTasks(filtered);
      
      if (filtered.length > 0 && !filtered.find(t => t.id === selectedTask)) {
        setSelectedTask(filtered[0].id);
      }
    } else {
      setFilteredTasks([]);
      setSelectedTask('');
    }
  }, [selectedProject, selectedTask]);

  // Add server time sync function
  const syncWithServer = async () => {
    try {
      const response = await fetch('/api/server-time');
      const serverTime = await response.json();
      const localTime = new Date().getTime();
      setTimeDiff(serverTime - localTime);
    } catch (error) {
      console.error('Failed to sync with server time:', error);
    }
  };

  // Add periodic sync
  useEffect(() => {
    syncWithServer();
    syncIntervalRef.current = setInterval(syncWithServer, 60000); // Sync every minute
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Modify startTimer function
  const startTimer = () => {
    if (!selectedProject || !selectedTask) {
      alert('Please select a project and task first');
      return;
    }
    
    const newTimerId = Date.now().toString();
    setCurrentTimerId(newTimerId);
    
    // Adjust start time with time difference
    const adjustedStartTime = new Date(Date.now() + timeDiff);
    timerStartTimeRef.current = adjustedStartTime;
    
    timerIntervalRef.current = setInterval(() => {
      const now = new Date(Date.now() + timeDiff);
      const elapsedSeconds = Math.floor((now - timerStartTimeRef.current) / 1000);
      setElapsedTime(elapsedSeconds);
    }, 1000);
    
    setIsTimerRunning(true);
  };

  // Modify stopTimer function
  const stopTimer = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (elapsedTime > 0) {
      const endTime = new Date(Date.now() + timeDiff);
      const newEntry = {
        id: currentTimerId,
        taskId: selectedTask,
        projectId: selectedProject,
        description: description,
        startTime: timerStartTimeRef.current,
        endTime: endTime,
        duration: elapsedTime,
        billable: isBillable,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      };
      
      try {
        // Add optimistic update
        setTimeEntries([newEntry, ...timeEntries]);
        
        // Send to server
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEntry),
        });
        
        if (!response.ok) {
          // Rollback on failure
          setTimeEntries(timeEntries);
          throw new Error('Failed to save time entry');
        }
      } catch (error) {
        console.error('Error saving time entry:', error);
        alert('Failed to save time entry. Please try again.');
      }
    }
    
    setIsTimerRunning(false);
    setElapsedTime(0);
    setCurrentTimerId(null);
    setDescription('');
  };

  // Create manual time entry
  const createManualEntry = () => {
    if (!selectedProject || !selectedTask || !manualStartDate || !manualEndDate || !manualStartTime || !manualEndTime) {
      alert('Please fill in all required fields');
      return;
    }
    
    const startDateTime = new Date(`${manualStartDate}T${manualStartTime}`);
    const endDateTime = new Date(`${manualEndDate}T${manualEndTime}`);
    
    if (endDateTime <= startDateTime) {
      alert('End time must be after start time');
      return;
    }
    
    const durationSeconds = Math.floor((endDateTime - startDateTime) / 1000);
    
    const newEntry = {
      id: Date.now().toString(),
      taskId: selectedTask,
      projectId: selectedProject,
      description: description,
      startTime: startDateTime,
      endTime: endDateTime,
      duration: durationSeconds,
      billable: isBillable,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    setTimeEntries([newEntry, ...timeEntries]);
    
    // Reset manual entry form
    setDescription('');
    setManualStartDate('');
    setManualEndDate('');
    setManualStartTime('');
    setManualEndTime('');
  };

  // Delete time entry
  const deleteTimeEntry = (entryId) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== entryId));
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="timer">
                <Clock className="mr-2 h-4 w-4" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="entries">
                <BarChart className="mr-2 h-4 w-4" />
                Time Entries
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select 
                      value={selectedProject} 
                      onValueChange={setSelectedProject}
                      disabled={isTimerRunning}
                    >
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="task">Task</Label>
                    <Select 
                      value={selectedTask} 
                      onValueChange={setSelectedTask}
                      disabled={isTimerRunning || filteredTasks.length === 0}
                    >
                      <SelectTrigger id="task">
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="billable" 
                      checked={isBillable}
                      onCheckedChange={setIsBillable}
                    />
                    <Label htmlFor="billable" className="cursor-pointer">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Billable
                    </Label>
                  </div>
                  
                  <div className="flex-grow">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="design, development, meeting..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-3xl font-mono">
                    {formatTime(elapsedTime)}
                  </div>
                  
                  <Button
                    onClick={isTimerRunning ? stopTimer : startTimer}
                    className={isTimerRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manualProject">Project</Label>
                    <Select 
                      value={selectedProject} 
                      onValueChange={setSelectedProject}
                    >
                      <SelectTrigger id="manualProject">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="manualTask">Task</Label>
                    <Select 
                      value={selectedTask} 
                      onValueChange={setSelectedTask}
                      disabled={filteredTasks.length === 0}
                    >
                      <SelectTrigger id="manualTask">
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="manualDescription">Description</Label>
                  <Input
                    id="manualDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you work on?"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={manualStartDate}
                      onChange={(e) => setManualStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={manualEndDate}
                      onChange={(e) => setManualEndDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={manualEndTime}
                      onChange={(e) => setManualEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manualBillable" 
                      checked={isBillable}
                      onCheckedChange={setIsBillable}
                    />
                    <Label htmlFor="manualBillable" className="cursor-pointer">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Billable
                    </Label>
                  </div>
                  
                  <div className="flex-grow">
                    <Label htmlFor="manualTags">Tags (comma separated)</Label>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      <Input
                        id="manualTags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="design, development, meeting..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button onClick={createManualEntry}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Time Entry
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="entries">
              <div className="space-y-4">
                <div className="border rounded-md">
                  {timeEntries.length > 0 ? (
                    <div className="divide-y">
                      {timeEntries.map(entry => {
                        const project = mockProjects.find(p => p.id === entry.projectId);
                        const task = mockTasks.find(t => t.id === entry.taskId);
                        
                        return (
                          <div key={entry.id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{entry.description || 'No description'}</div>
                                <div className="text-sm text-gray-500">
                                  {project ? project.name : 'Unknown Project'} - {task ? task.name : 'Unknown Task'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  {formatDate(entry.startTime)}
                                  {entry.tags.length > 0 && (
                                    <span className="ml-2">
                                      <Tag className="inline h-3 w-3 mr-1" />
                                      {entry.tags.join(', ')}
                                    </span>
                                  )}
                                  {entry.billable && (
                                    <span className="ml-2 text-green-600">
                                      <DollarSign className="inline h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="font-mono mr-4">
                                  {formatDuration(entry.duration)}
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteTimeEntry(entry.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No time entries yet
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracker; 