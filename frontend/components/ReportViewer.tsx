import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Box, Heading, Text, Spinner, Alert, AlertIcon, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

interface MedicalInfo {
  symptoms: string[];
  diagnosis: string;
  recommendations: string[];
  medications: string[];
  followUpNeeded: boolean;
}

interface Report {
  _id: string;
  appointmentId: string;
  doctor: string;
  report: string;
  medicalInfo: MedicalInfo;
  followUpQuestions: string;
  createdAt: string;
}

interface ReportViewerProps {
  appointmentId: string;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ appointmentId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/reports/${appointmentId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        setReports(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch reports');
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && token) {
      fetchReports();
    }
  }, [appointmentId, token]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading reports...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (reports.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No reports found for this appointment.
      </Alert>
    );
  }

  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Box>
      <Heading size="lg" mb={4}>Medical Reports</Heading>
      <Text mb={4}>
        {sortedReports.length} report{sortedReports.length !== 1 ? 's' : ''} available
      </Text>

      {sortedReports.map((report) => (
        <Box 
          key={report._id} 
          borderWidth="1px" 
          borderRadius="lg" 
          p={5} 
          mb={5}
          boxShadow="md"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Report from {new Date(report.createdAt).toLocaleDateString()}</Heading>
            <Badge colorScheme={report.medicalInfo.followUpNeeded ? "red" : "green"}>
              {report.medicalInfo.followUpNeeded ? "Follow-up Needed" : "No Follow-up Required"}
            </Badge>
          </Box>

          <Accordion allowToggle defaultIndex={[0]}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Summary
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text whiteSpace="pre-line">{report.report}</Text>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Medical Information
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Box mb={3}>
                  <Text fontWeight="bold">Symptoms:</Text>
                  <List spacing={2} mt={2}>
                    {report.medicalInfo.symptoms.map((symptom, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={WarningIcon} color="yellow.500" />
                        {symptom}
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box mb={3}>
                  <Text fontWeight="bold">Diagnosis:</Text>
                  <Text mt={2}>{report.medicalInfo.diagnosis}</Text>
                </Box>

                <Box mb={3}>
                  <Text fontWeight="bold">Recommendations:</Text>
                  <List spacing={2} mt={2}>
                    {report.medicalInfo.recommendations.map((rec, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckCircleIcon} color="green.500" />
                        {rec}
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box mb={3}>
                  <Text fontWeight="bold">Medications:</Text>
                  <List spacing={2} mt={2}>
                    {report.medicalInfo.medications.map((med, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckCircleIcon} color="blue.500" />
                        {med}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </AccordionPanel>
            </AccordionItem>

            {report.followUpQuestions && (
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Follow-up Questions
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text whiteSpace="pre-line">{report.followUpQuestions}</Text>
                </AccordionPanel>
              </AccordionItem>
            )}
          </Accordion>
        </Box>
      ))}
    </Box>
  );
};

export default ReportViewer; 