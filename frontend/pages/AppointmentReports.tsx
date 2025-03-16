import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReportViewer from '../components/ReportViewer';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Spinner, 
  Alert, 
  AlertIcon,
  Divider,
  Badge,
  HStack
} from '@chakra-ui/react';
import { ArrowBackIcon, CalendarIcon, TimeIcon, InfoIcon } from '@chakra-ui/icons';

interface Appointment {
  _id: string;
  title: string;
  date: string;
  time: string;
  doctor: {
    _id: string;
    name: string;
    specialty: string;
  };
  patient: {
    _id: string;
    name: string;
  };
  status: string;
  notes?: string;
}

const AppointmentReports: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/appointments/${appointmentId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        setAppointment(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch appointment details');
        console.error('Error fetching appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && token) {
      fetchAppointment();
    }
  }, [appointmentId, token]);

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'scheduled':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading appointment details...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} onClick={handleBack}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          Appointment not found
        </Alert>
        <Button leftIcon={<ArrowBackIcon />} onClick={handleBack}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={10}>
      <Button leftIcon={<ArrowBackIcon />} onClick={handleBack} mb={6}>
        Back to Appointments
      </Button>

      <Box borderWidth="1px" borderRadius="lg" p={6} mb={8} boxShadow="md">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="lg">{appointment.title}</Heading>
          <Badge colorScheme={getStatusColor(appointment.status)} fontSize="md" px={3} py={1}>
            {appointment.status}
          </Badge>
        </Flex>

        <HStack spacing={8} mb={4}>
          <Flex align="center">
            <CalendarIcon mr={2} color="blue.500" />
            <Text>{new Date(appointment.date).toLocaleDateString()}</Text>
          </Flex>
          <Flex align="center">
            <TimeIcon mr={2} color="blue.500" />
            <Text>{appointment.time}</Text>
          </Flex>
        </HStack>

        <Box mb={4}>
          <Text fontWeight="bold">Doctor:</Text>
          <Text>{appointment.doctor.name} - {appointment.doctor.specialty}</Text>
        </Box>

        <Box mb={4}>
          <Text fontWeight="bold">Patient:</Text>
          <Text>{appointment.patient.name}</Text>
        </Box>

        {appointment.notes && (
          <Box mb={4}>
            <Text fontWeight="bold">Notes:</Text>
            <Text>{appointment.notes}</Text>
          </Box>
        )}
      </Box>

      <Divider my={6} />

      {appointment.status.toLowerCase() === 'completed' ? (
        <ReportViewer appointmentId={appointmentId || ''} />
      ) : (
        <Alert status="info">
          <AlertIcon />
          Reports are only available for completed appointments.
        </Alert>
      )}
    </Container>
  );
};

export default AppointmentReports;