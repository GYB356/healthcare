import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { headers } from 'next/headers';
import { logDashboardAccess, logPatientDataAccess, logPatientAction } from '@/lib/audit-utils';
import { AuditAction, AuditSeverity } from '@prisma/client';

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify authenticated user and log access
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check if user is a patient
    if (session?.user.role !== "PATIENT") {
      router.push("/dashboard"); // Redirect to appropriate dashboard
      return;
    }

    const initDashboard = async () => {
      try {
        if (session?.user.id && session?.user.patientId) {
          // Log dashboard access
          await logDashboardAccess({
            userId: session.user.id,
            patientId: session.user.patientId,
            sessionId: session.sessionId,
            ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
            userAgent: headers().get('user-agent'),
          });
        }
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Access denied. Please contact support if you believe this is an error.');
        return;
      }
    };

    initDashboard();
  }, [session, status, router]);

  // Fetch patient data with audit logging
  useEffect(() => {
    if (session?.user.patientId && !error) {
      setLoading(true);
      
      const fetchData = async () => {
        try {
          // In a real implementation, you would fetch this data from your API
          // For now, we'll use mock data
          const mockPatientData: PatientData = {
            // ... existing mock data ...
          };

          // Log data access
          if (session.user.id) {
            await logPatientDataAccess({
              userId: session.user.id,
              patientId: session.user.patientId,
              sessionId: session.sessionId,
              ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
              userAgent: headers().get('user-agent'),
            }, 'summary');
          }
          
          setPatientData(mockPatientData);
        } catch (error) {
          console.error('Failed to fetch patient data:', error);
          setError('Failed to load patient data. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [session, error]);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ... existing loading state code ...

  // Add audit logging to tab changes
  const handleTabChange = async (value: string) => {
    if (session?.user.id && session?.user.patientId) {
      try {
        await logPatientDataAccess({
          userId: session.user.id,
          patientId: session.user.patientId,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        }, value as 'appointments' | 'medications' | 'vitals' | 'summary');
      } catch (error) {
        console.error(`Failed to log ${value} tab access:`, error);
      }
    }
  };

  // Add audit logging to actions
  const handleAction = async (action: string) => {
    if (session?.user.id && session?.user.patientId) {
      try {
        await logPatientAction({
          userId: session.user.id,
          patientId: session.user.patientId,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        },
        AuditAction.CREATE,
        `Patient initiated ${action}`,
        AuditSeverity.LOW
        );
      } catch (error) {
        console.error(`Failed to log action ${action}:`, error);
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* ... existing header code ... */}

      {/* Action buttons with audit logging */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button 
          className="py-6 flex flex-col h-auto items-center gap-2" 
          onClick={() => {
            handleAction('schedule_appointment');
            router.push("/appointments/schedule");
          }}
        >
          <CalendarDays size={24} />
          <span>Schedule Appointment</span>
        </Button>
        {/* ... other action buttons with similar audit logging ... */}
      </div>

      {/* Main content with audit logging */}
      <Tabs defaultValue="appointments" className="w-full" onValueChange={handleTabChange}>
        {/* ... existing tabs code ... */}
      </Tabs>
    </div>
  );
} 