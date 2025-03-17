import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define available time slots (9 AM to 5 PM, 1-hour intervals)
const DEFAULT_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'Doctor ID and date are required' },
        { status: 400 }
      );
    }

    // Get booked appointments for the specified doctor and date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: 'SCHEDULED',
      },
      select: {
        time: true,
      },
    });

    // Get booked time slots
    const bookedSlots = bookedAppointments.map(appointment => appointment.time);

    // Filter out booked slots from available slots
    const availableSlots = DEFAULT_SLOTS.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Error fetching available slots' },
      { status: 500 }
    );
  }
} 