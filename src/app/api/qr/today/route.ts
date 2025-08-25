import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getCurrentDateEST } from '@/lib/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin privileges required to view QR codes' 
      }, { status: 403 });
    }

    const currentDate = getCurrentDateEST();

    // Get today's QR code
    const qrQuery = await adminDb.collection(COLLECTIONS.QR_CODES)
      .where('date', '==', currentDate)
      .where('isActive', '==', true)
      .get();

    if (qrQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'No active QR code found for today' 
      }, { status: 404 });
    }

    const qrDoc = qrQuery.docs[0];
    const qrData = qrDoc.data();

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrDoc.id,
        code: qrData.code,
        date: qrData.date,
        expiresAt: qrData.expiresAt
      }
    });

  } catch (error) {
    console.error('Error getting QR code:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
