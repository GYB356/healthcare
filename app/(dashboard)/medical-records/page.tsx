 "use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { headers } from 'next/headers';
import { logMedicalRecordAccess, logAttachmentDownload, logMedicalRecordSearch } from '@/lib/medical-records-utils';

// ... existing imports ...

export default function MedicalRecordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<string[]>([]);

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

    const initMedicalRecords = async () => {
      try {
        if (session?.user.id && session?.user.patientId) {
          // Log medical records access
          await logMedicalRecordAccess({
            userId: session.user.id,
            patientId: session.user.patientId,
            sessionId: session.sessionId,
            ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
            userAgent: headers().get('user-agent'),
          });
        }
      } catch (error) {
        console.error('Failed to initialize medical records:', error);
        setError('Access denied. Please contact support if you believe this is an error.');
        return;
      }
    };

    initMedicalRecords();
  }, [session, status, router]);

  // Fetch medical records with audit logging
  useEffect(() => {
    if (session?.user.patientId && !error) {
      setLoading(true);
      
      const fetchRecords = async () => {
        try {
          // In a real implementation, you would fetch this data from your API
          // For now, we'll use mock data
          const mockRecords: MedicalRecord[] = [
            // ... existing mock data ...
          ];

          setRecords(mockRecords);
        } catch (error) {
          console.error('Failed to fetch medical records:', error);
          setError('Failed to load medical records. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchRecords();
    }
  }, [session, error]);

  // Handle search with audit logging
  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    
    if (session?.user.id && session?.user.patientId) {
      try {
        await logMedicalRecordSearch({
          userId: session.user.id,
          patientId: session.user.patientId,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        }, term, filterType || undefined);
      } catch (error) {
        console.error('Failed to log search:', error);
      }
    }
  }, [session, filterType]);

  // Handle filter with audit logging
  const handleFilter = useCallback(async (type: string | null) => {
    setFilterType(type);
    
    if (session?.user.id && session?.user.patientId) {
      try {
        await logMedicalRecordSearch({
          userId: session.user.id,
          patientId: session.user.patientId,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        }, searchTerm, type || undefined);
      } catch (error) {
        console.error('Failed to log filter:', error);
      }
    }
  }, [session, searchTerm]);

  // Handle download with audit logging
  const handleDownload = async (attachment: Attachment) => {
    if (session?.user.id && session?.user.patientId) {
      try {
        await logAttachmentDownload({
          userId: session.user.id,
          patientId: session.user.patientId,
          recordId: selectedRecord?.id,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        }, attachment.id, attachment.fileName);
        
        // In a real implementation, this would trigger a download
        toast.success(`Downloaded ${attachment.fileName}`);
      } catch (error) {
        console.error('Failed to log download:', error);
        toast.error('Failed to download file. Please try again.');
      }
    }
  };

  // Handle record view with audit logging
  const handleViewRecord = async (record: MedicalRecord) => {
    if (session?.user.id && session?.user.patientId) {
      try {
        await logMedicalRecordAccess({
          userId: session.user.id,
          patientId: session.user.patientId,
          recordId: record.id,
          sessionId: session.sessionId,
          ipAddress: headers().get('x-real-ip') || headers().get('x-forwarded-for'),
          userAgent: headers().get('user-agent'),
        });
        
        setSelectedRecord(record);
      } catch (error) {
        console.error('Failed to log record view:', error);
        toast.error('Failed to access record. Please try again.');
      }
    }
  };

  // ... existing loading state code ...

  return (
    <div className="container mx-auto py-6">
      {/* ... existing header code ... */}

      {/* Search and filter with audit logging */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search records..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              {filterType || "Filter by type"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFilter(null)}>
              All Records
            </DropdownMenuItem>
            {recordTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => handleFilter(type)}>
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ... rest of the existing code ... */}
    </div>
  );
}