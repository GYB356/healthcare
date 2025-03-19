import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addMinutes, format, parse, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

// Define business hours (9 AM to 5 PM)
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;
const SLOT_DURATION = 30; // minutes

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const startTime = setHours(setMinutes(date, 0), BUSINESS_START_HOUR);
    const endTime = setHours(setMinutes(date, 0), BUSINESS_END_HOUR);

    // Get existing appointments for the date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          equals: date,
        },
        status: 'SCHEDULED',
      },
      select: {
        time: true,
        duration: true,
      },
    });

    // Generate all possible time slots
    const slots = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const timeStr = format(currentTime, 'HH:mm');
      
      // Check if slot is available
      const isBooked = existingAppointments.some(apt => {
        const aptTime = parse(apt.time, 'HH:mm', new Date());
        const aptEndTime = addMinutes(aptTime, apt.duration);
        const slotEndTime = addMinutes(currentTime, SLOT_DURATION);
        
        return (
          (currentTime >= aptTime && currentTime < aptEndTime) ||
          (slotEndTime > aptTime && slotEndTime <= aptEndTime)
        );
      });

      slots.push({
        time: timeStr,
        available: !isBooked,
      });

      currentTime = addMinutes(currentTime, SLOT_DURATION);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
} 