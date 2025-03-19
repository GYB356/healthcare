 "use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  patientId: string;
  patient: {
    name: string;
    dateOfBirth: string;
  };
  doctorId: string;
  doctor: {
    name: string;
    specialization: string;
  };
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function MedicalRecordsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchRecords();
  }, [session, router, pagination.page, search, recordType]);

  const fetchRecords = async () => {
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(recordType && { type: recordType }),
      });

      const response = await fetch(`/api/medical-records?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch medical records");
      }

      const data = await response.json();
      setRecords(data.records);
      setPagination(data.pagination);
        } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Failed to load medical records");
        } finally {
          setLoading(false);
        }
      };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (value: string) => {
    setRecordType(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Medical Records</h1>
        {session?.user.role === "DOCTOR" && (
          <Button asChild>
            <Link href="/medical-records/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-500" />
          <Input
            placeholder="Search records..."
                value={search}
            onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
          />
        </div>
            <Select
              value={recordType}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Record Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.date), "PPP")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.patient.name}</p>
                            <p className="text-sm text-gray-500">
                              DOB: {format(new Date(record.patient.dateOfBirth), "PP")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{record.doctor.name}</p>
                            <p className="text-sm text-gray-500">
                              {record.doctor.specialization.replace(/_/g, " ")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <p className="truncate max-w-xs">
                            {record.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/medical-records/${record.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          isActive={pagination.page > 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.pages }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            onClick={() => handlePageChange(i + 1)}
                            isActive={pagination.page === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          isActive={pagination.page < pagination.pages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
      </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}