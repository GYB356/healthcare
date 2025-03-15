import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Button,
  Heading,
  Textarea,
  Text,
  VStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider
} from "@chakra-ui/react";

interface MedicalReportProps {
  appointmentId: string;
  onReportGenerated?: () => void;
}

const MedicalReport: React.FC<MedicalReportProps> = ({ appointmentId, onReportGenerated }) => {
  const [transcript, setTranscript] = useState<string>("");
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const toast = useToast();

  const generateReport = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Transcript required",
        description: "Please enter the consultation transcript.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        "/api/reports",
        { appointmentId, transcript },
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token
          }
        }
      );

      setReport(response.data.report.report);
      
      toast({
        title: "Report generated",
        description: "Medical report has been successfully generated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Call the callback if provided
      if (onReportGenerated) {
        onReportGenerated();
      }
    } catch (err: any) {
      console.error("Error generating report:", err);
      setError(err.response?.data?.message || "Failed to generate report");
      
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to generate report",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="md" bg="white">
      <Heading size="md" mb={4}>Generate Medical Report</Heading>
      
      <VStack spacing={4} align="stretch">
        <Box>
          <Text mb={2} fontWeight="medium">Consultation Transcript</Text>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter the consultation transcript here..."
            size="md"
            minHeight="200px"
            resize="vertical"
          />
        </Box>
        
        <Button
          colorScheme="blue"
          onClick={generateReport}
          isLoading={loading}
          loadingText="Generating..."
          width="full"
        >
          Generate Report
        </Button>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {report && (
          <>
            <Divider my={4} />
            <Box>
              <Heading size="sm" mb={2}>Generated Report</Heading>
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                whiteSpace="pre-line"
                maxHeight="300px"
                overflowY="auto"
              >
                {report}
              </Box>
            </Box>
          </>
        )}
        
        {loading && (
          <Box textAlign="center" py={4}>
            <Spinner size="xl" />
            <Text mt={2}>Generating medical report using AI...</Text>
            <Text fontSize="sm" color="gray.500">This may take a moment</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default MedicalReport; 