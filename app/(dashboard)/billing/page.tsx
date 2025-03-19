"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  FilePlus,
  FileText,
  Filter,
  Search,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Printer,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Plus,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "react-hot-toast";

// Types
interface Patient {
  id: string;
  name: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  date: Date;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
}

interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  coverageDetails: string;
  coveragePercentage: number;
}

interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: string;
  description?: string;
  items: InvoiceItem[];
  payments: Payment[];
  insuranceCoverage?: number;
  patientResponsibility?: number;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPatientView, setIsPatientView] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    patientId: "",
    description: "",
    dueDate: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }]
  });
  
  // Payment form state
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    method: "credit",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    notes: ""
  });

  // Check authenticated user
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Determine if user is a patient or staff
    if (session?.user) {
      setIsPatientView(session.user.role === "patient");
    }
  }, [session, status, router]);

  // Load billing data
  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock patients data
        const mockPatients: Patient[] = [
          { id: "pat1", name: "John Doe" },
          { id: "pat2", name: "Sarah Johnson" },
          { id: "pat3", name: "Robert Chen" },
          { id: "pat4", name: "Maria Rodriguez" },
        ];
        
        // Mock invoices data
        const mockInvoices: Invoice[] = [
          {
            id: "inv1",
            patientId: "pat1",
            patientName: "John Doe",
            date: new Date(2025, 2, 10),
            dueDate: new Date(2025, 3, 10),
            amount: 250.00,
            status: "paid",
            description: "Annual physical examination",
            items: [
              { id: "item1", description: "Comprehensive physical exam", quantity: 1, unitPrice: 150.00, total: 150.00 },
              { id: "item2", description: "Blood panel", quantity: 1, unitPrice: 100.00, total: 100.00 }
            ],
            payments: [
              { id: "pay1", date: new Date(2025, 2, 15), amount: 250.00, method: "credit", status: "completed", transactionId: "txn_123456" }
            ],
            insuranceCoverage: 200.00,
            patientResponsibility: 50.00
          },
          {
            id: "inv2",
            patientId: "pat1",
            patientName: "John Doe",
            date: new Date(2025, 2, 1),
            dueDate: new Date(2025, 3, 1),
            amount: 175.00,
            status: "pending",
            description: "Follow-up consultation",
            items: [
              { id: "item3", description: "Follow-up visit", quantity: 1, unitPrice: 125.00, total: 125.00 },
              { id: "item4", description: "Medication review", quantity: 1, unitPrice: 50.00, total: 50.00 }
            ],
            payments: [],
            insuranceCoverage: 140.00,
            patientResponsibility: 35.00
          },
          {
            id: "inv3",
            patientId: "pat2",
            patientName: "Sarah Johnson",
            date: new Date(2025, 1, 20),
            dueDate: new Date(2025, 2, 20),
            amount: 350.00,
            status: "overdue",
            description: "Emergency room visit",
            items: [
              { id: "item5", description: "Emergency evaluation", quantity: 1, unitPrice: 200.00, total: 200.00 },
              { id: "item6", description: "X-Ray", quantity: 1, unitPrice: 150.00, total: 150.00 }
            ],
            payments: [
              { id: "pay2", date: new Date(2025, 2, 5), amount: 150.00, method: "debit", status: "completed", transactionId: "txn_789012" }
            ],
            insuranceCoverage: 280.00,
            patientResponsibility: 70.00
          },
          {
            id: "inv4",
            patientId: "pat3",
            patientName: "Robert Chen",
            date: new Date(2025, 2, 5),
            dueDate: new Date(2025, 3, 5),
            amount: 420.00,
            status: "pending",
            description: "Specialist consultation",
            items: [
              { id: "item7", description: "Cardiology consultation", quantity: 1, unitPrice: 300.00, total: 300.00 },
              { id: "item8", description: "ECG", quantity: 1, unitPrice: 120.00, total: 120.00 }
            ],
            payments: [],
            insuranceCoverage: 336.00,
            patientResponsibility: 84.00
          },
          {
            id: "inv5",
            patientId: "pat4",
            patientName: "Maria Rodriguez",
            date: new Date(2025, 1, 15),
            dueDate: new Date(2025, 2, 15),
            amount: 180.00,
            status: "paid",
            description: "Prescription refill appointment",
            items: [
              { id: "item9", description: "Nurse practitioner visit", quantity: 1, unitPrice: 90.00, total: 90.00 },
              { id: "item10", description: "Medication management", quantity: 1, unitPrice: 90.00, total: 90.00 }
            ],
            payments: [
              { id: "pay3", date: new Date(2025, 1, 20), amount: 180.00, method: "cash", status: "completed" }
            ],
            insuranceCoverage: 144.00,
            patientResponsibility: 36.00
          }
        ];
        
        // Filter invoices if patient view
        let filteredMockInvoices = mockInvoices;
        if (isPatientView && session.user.patientId) {
          filteredMockInvoices = mockInvoices.filter(invoice => invoice.patientId === session.user.patientId);
        }
        
        setPatients(mockPatients);
        setInvoices(filteredMockInvoices);
        setFilteredInvoices(filteredMockInvoices);
        setLoading(false);
      }, 1000);
    }
  }, [session, isPatientView]);

  // Filter invoices when search or status filter changes
  useEffect(() => {
    let filtered = invoices;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, invoices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500" variant="secondary">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit':
      case 'debit':
        return <CreditCard size={16} />;
      case 'cash':
        return <DollarSign size={16} />;
      case 'insurance':
        return <FileText size={16} />;
      default:
        return <ArrowRightLeft size={16} />;
    }
  };
  
  // Get total amount paid for an invoice
  const getTotalPaid = (invoice: Invoice) => {
    return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };
  
  // Get remaining balance for an invoice
  const getRemainingBalance = (invoice: Invoice) => {
    const totalPaid = getTotalPaid(invoice);
    return Math.max(0, invoice.amount - totalPaid);
  };
  
  // Handle new invoice item change
  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate total if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : updatedItems[index].unitPrice;
      updatedItems[index].total = quantity * unitPrice;
    }
    
    setNewInvoice({
      ...newInvoice,
      items: updatedItems
    });
  };
  
  // Add new invoice item
  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, unitPrice: 0 }]
    });
  };
  
  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      const updatedItems = [...newInvoice.items];
      updatedItems.splice(index, 1);
      setNewInvoice({
        ...newInvoice,
        items: updatedItems
      });
    }
  };
  
  // Calculate new invoice total
  const calculateInvoiceTotal = () => {
    return newInvoice.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };
  
  // Handle create invoice
  const handleCreateInvoice = () => {
    // Validate form
    if (!newInvoice.patientId || !newInvoice.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (newInvoice.items.some(item => !item.description || !item.quantity || !item.unitPrice)) {
      toast.error("Please fill all item details");
      return;
    }
    
    // Create new invoice
    const patient = patients.find(p => p.id === newInvoice.patientId);
    if (!patient) {
      toast.error("Invalid patient selection");
      return;
    }
    
    const invoiceItems: InvoiceItem[] = newInvoice.items.map((item, index) => ({
      id: `new-item-${index}`,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice)
    }));
    
    const newInvoiceData: Invoice = {
      id: `inv-${Date.now()}`,
      patientId: newInvoice.patientId,
      patientName: patient.name,
      date: new Date(),
      dueDate: new Date(newInvoice.dueDate),
      amount: calculateInvoiceTotal(),
      status: "pending",
      description: newInvoice.description,
      items: invoiceItems,
      payments: [],
      insuranceCoverage: calculateInvoiceTotal() * 0.8, // Assuming 80% insurance coverage
      patientResponsibility: calculateInvoiceTotal() * 0.2 // Assuming 20% patient responsibility
    };
    
    // Add to invoices list
    setInvoices([newInvoiceData, ...invoices]);
    setFilteredInvoices([newInvoiceData, ...filteredInvoices]);
    
    // Reset form and close dialog
    setNewInvoice({
      patientId: "",
      description: "",
      dueDate: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }]
    });
    setShowNewInvoiceDialog(false);
    
    // Show success message
    toast.success("Invoice created successfully");
  };
  
  // Handle make payment
  const handleMakePayment = () => {
    if (!selectedInvoice) return;
    
    // Validate form
    if (!paymentDetails.amount || !paymentDetails.method) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (paymentDetails.method === 'credit' || paymentDetails.method === 'debit') {
      if (!paymentDetails.cardNumber || !paymentDetails.cardExpiry || !paymentDetails.cardCvc) {
        toast.error("Please enter card details");
        return;
      }
    }
    
    // Create new payment
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      date: new Date(),
      amount: Number(paymentDetails.amount),
      method: paymentDetails.method,
      status: "completed",
      transactionId: `txn_${Math.random().toString(36).substring(2, 10)}`
    };
    
    // Update invoice with new payment
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === selectedInvoice.id) {
        const updatedInvoice = {
          ...invoice,
          payments: [...invoice.payments, newPayment]
        };
        
        // Update status if fully paid
        const totalPaid = getTotalPaid(updatedInvoice);
        if (totalPaid >= invoice.amount) {
          updatedInvoice.status = 'paid';
        }
        
        return updatedInvoice;
      }
      return invoice;
    });
    
    setInvoices(updatedInvoices);
    
    // Reset form and close dialog
    setPaymentDetails({
      amount: 0,
      method: "credit",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      notes: ""
    });
    setShowPaymentDialog(false);
    
    // Show success message
    toast.success("Payment processed successfully");
  };
  
  // Handle view invoice details
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };
  
  // Handle make payment click
  const handleMakePaymentClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDetails({
      ...paymentDetails,
      amount: getRemainingBalance(invoice)
    });
    setShowPaymentDialog(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center h-72">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-gray-600">
            {isPatientView 
              ? "View and manage your healthcare bills and insurance" 
              : "Manage patient invoices and payments"}
          </p>
        </div>
        
        {/* Action buttons */}
        {!isPatientView && (
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setShowNewInvoiceDialog(true)} className="flex items-center gap-2">
              <FilePlus size={16} />
              Create New Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                <h3 className="text-3xl font-bold">
                  {formatCurrency(
                    filteredInvoices
                      .filter(invoice => invoice.status !== 'paid')
                      .reduce((sum, invoice) => sum + getRemainingBalance(invoice), 0)
                  )}
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid This Month</p>
                <h3 className="text-3xl font-bold">
                  {formatCurrency(
                    filteredInvoices
                      .flatMap(invoice => invoice.payments)
                      .filter(payment => {
                        const now = new Date();
                        const paymentDate = new Date(payment.date);
                        return paymentDate.getMonth() === now.getMonth() && 
                               paymentDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, payment) => sum + payment.amount, 0)
                  )}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Payments</p>
                <h3 className="text-3xl font-bold">
                  {formatCurrency(
                    filteredInvoices
                      .filter(invoice => invoice.status === 'overdue')
                      .reduce((sum, invoice) => sum + getRemainingBalance(invoice), 0)
                  )}
                </h3>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main billing content */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="insurance">Insurance Information</TabsTrigger>
        </TabsList>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter size={16} />
                      {statusFilter ? `Status: ${statusFilter}` : "Filter by status"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("paid")}>
                      Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
                      Overdue
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        {!isPatientView && <TableHead>Patient</TableHead>}
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          {!isPatientView && <TableCell>{invoice.patientName}</TableCell>}
                          <TableCell>{formatDate(invoice.date)}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <FileText size={16} />
                              </Button>
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleMakePaymentClick(invoice)}
                                >
                                  <CreditCard size={16} />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <ChevronDown size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    <span>Print Invoice</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.success(`Invoice ${invoice.id} downloaded`)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Download PDF</span>
                                  </DropdownMenuItem>
                                  {!isPatientView && invoice.status !== 'paid' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => toast.success(`Email sent to ${invoice.patientName}`)}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        <span>Send Reminder</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No invoices found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter
                      ? "Try adjusting your search or filters"
                      : "You don't have any invoices yet"}
                  </p>
                  {(searchTerm || statusFilter) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter(null);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
              <CardDescription>
                Your healthcare insurance details and coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPatientView ? (
                // Patient view - show their insurance info
                <div className="space-y-6">
                  <div className="p-6 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">BlueCross BlueShield</h3>
                        <p className="text-gray-500">PPO Plan</p>
                      </div>
                      <Badge>Primary</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Policy Number</p>
                        <p>XYZ12345678</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Group Number</p>
                        <p>GRP9876543</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Member ID</p>
                        <p>MEM123456789</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Effective Date</p>
                        <p>January 1, 2025</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="coverage">
                          <AccordionTrigger>Coverage Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>Primary Care Visit</span>
                                <span>$25 Copay</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Specialist Visit</span>
                                <span>$50 Copay</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Emergency Room</span>
                                <span>$250 Copay</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Hospital Stay</span>
                                <span>20% after deductible</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Annual Deductible</span>
                                <span>$1,500 Individual</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Out-of-Pocket Maximum</span>
                                <span>$5,000 Individual</span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Customer Service</p>
                          <p>1-800-123-4567</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Provider Services</p>
                          <p>1-888-987-6543</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={() => toast.success("Insurance card download started")}>
                    Download Insurance Card
                  </Button>
                </div>
              ) : (
                // Staff view - list of patients with insurance info
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{patient.name}</h3>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                            <Badge variant="outline">BlueCross BlueShield</Badge>
                            <span className="text-sm text-gray-500">Policy: XYZ12345678</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => toast.success(`Viewing ${patient.name}'s insurance details`)}>
                          <ChevronRight size={16} />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice && !showPaymentDialog} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Invoice #{selectedInvoice.id} - {formatDate(selectedInvoice.date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Invoice header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{selectedInvoice.patientName}</h3>
                  <p className="text-gray-500">{selectedInvoice.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>
              </div>
              
              {/* Invoice items */}
              <div>
                <h4 className="font-medium mb-2">Services & Charges</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Invoice summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                  
                  {selectedInvoice.insuranceCoverage !== undefined && (
                    <div className="flex justify-between">
                      <span>Insurance Coverage</span>
                      <span>-{formatCurrency(selectedInvoice.insuranceCoverage)}</span>
                    </div>
                  )}
                  
                  {selectedInvoice.patientResponsibility !== undefined && (
                    <div className="flex justify-between font-medium">
                      <span>Patient Responsibility</span>
                      <span>{formatCurrency(selectedInvoice.patientResponsibility)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Paid</span>
                      <span>{formatCurrency(getTotalPaid(selectedInvoice))}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Remaining Balance</span>
                      <span>{formatCurrency(getRemainingBalance(selectedInvoice))}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment history */}
              {selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Payment History</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.method)}
                            <span className="capitalize">{payment.method}</span>
                          </TableCell>
                          <TableCell>{payment.transactionId || "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="sm:w-auto w-full" onClick={() => window.print()}>
                <Printer size={16} className="mr-2" />
                Print Invoice
              </Button>
              <Button variant="outline" className="sm:w-auto w-full" onClick={() => toast.success(`Invoice ${selectedInvoice.id} downloaded`)}>
                <Download size={16} className="mr-2" />
                Download PDF
              </Button>
              {selectedInvoice.status !== 'paid' && (
                <Button className="sm:w-auto w-full" onClick={() => handleMakePaymentClick(selectedInvoice)}>
                  <CreditCard size={16} className="mr-2" />
                  Make Payment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Invoice Dialog */}
      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Enter the details to generate a new patient invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient">Patient *</Label>
                <Select
                  value={newInvoice.patientId}
                  onValueChange={(value) => setNewInvoice({...newInvoice, patientId: value})}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Invoice description"
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Invoice Items *</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 flex items-center gap-1"
                  onClick={addInvoiceItem}
                >
                  <Plus size={14} />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {newInvoice.items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 p-3 border rounded-md">
                    <div className="flex-grow">
                      <Label htmlFor={`item-desc-${index}`} className="sr-only">Description</Label>
                      <Input
                        id={`item-desc-${index}`}
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleInvoiceItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-20">
                      <Label htmlFor={`item-qty-${index}`} className="sr-only">Quantity</Label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleInvoiceItemChange(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <Label htmlFor={`item-price-${index}`} className="sr-only">Unit Price</Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unitPrice}
                        onChange={(e) => handleInvoiceItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 md:self-center"
                      onClick={() => removeInvoiceItem(index)}
                      disabled={newInvoice.items.length <= 1}
                    >
                      <XCircle size={16} className="text-gray-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between font-bold">
                <span>Total Amount</span>
                <span>{formatCurrency(calculateInvoiceTotal())}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>Invoice #{selectedInvoice.id} - {formatCurrency(getRemainingBalance(selectedInvoice))} due</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={paymentDetails.amount}
                  onChange={(e) => setPaymentDetails({...paymentDetails, amount: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <Select
                value={paymentDetails.method}
                onValueChange={(value) => setPaymentDetails({...paymentDetails, method: value})}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(paymentDetails.method === 'credit' || paymentDetails.method === 'debit') && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardExpiry">Expiration Date *</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={paymentDetails.cardExpiry}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardExpiry: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardCvc">CVC *</Label>
                    <Input
                      id="cardCvc"
                      placeholder="CVC"
                      value={paymentDetails.cardCvc}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardCvc: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Payment Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this payment..."
                value={paymentDetails.notes}
                onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMakePayment}>
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 