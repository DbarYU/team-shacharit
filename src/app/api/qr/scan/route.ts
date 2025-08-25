import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getCurrentDateEST } from '@/lib/utils/dateUtils';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { qrCode } = await request.json();
    
    if (!qrCode) {
      return NextResponse.json({ 
        success: false, 
        message: 'QR code is required' 
      }, { status: 400 });
    }

    const currentDate = getCurrentDateEST();

    // Find the QR code
    const qrQuery = await adminDb.collection(COLLECTIONS.QR_CODES)
      .where('code', '==', qrCode)
      .where('date', '==', currentDate)
      .where('isActive', '==', true)
      .get();

    if (qrQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired QR code' 
      }, { status: 400 });
    }

    const qrDoc = qrQuery.docs[0];
    const qrData = qrDoc.data();

    // Check if QR code has expired
    if (new Date() > qrData.expiresAt.toDate()) {
      return NextResponse.json({ 
        success: false, 
        message: 'QR code has expired' 
      }, { status: 400 });
    }

    // Check if user already checked in today
    const existingAttendanceQuery = await adminDb.collection(COLLECTIONS.ATTENDANCE)
      .where('userId', '==', user.uid)
      .where('date', '==', currentDate)
      .get();

    if (!existingAttendanceQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'You have already checked in today' 
      }, { status: 400 });
    }

    // Record attendance
    const attendanceData = {
      userId: user.uid,
      date: currentDate,
      checkInTime: new Date(),
      qrCodeId: qrDoc.id
    };

    const attendanceRef = await adminDb.collection(COLLECTIONS.ATTENDANCE).add(attendanceData);

    return NextResponse.json({
      success: true,
      message: 'Check-in successful!',
      attendance: {
        id: attendanceRef.id,
        ...attendanceData
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
