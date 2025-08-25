import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getCurrentDateEST } from '@/lib/utils/dateUtils';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
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
        message: 'Admin privileges required to generate QR codes' 
      }, { status: 403 });
    }

    const currentDate = getCurrentDateEST();

    // Check if QR code already exists for today
    const existingQrQuery = await adminDb.collection(COLLECTIONS.QR_CODES)
      .where('date', '==', currentDate)
      .where('isActive', '==', true)
      .get();

    if (!existingQrQuery.empty) {
      const existingQr = existingQrQuery.docs[0];
      return NextResponse.json({
        success: true,
        message: 'QR code already exists for today',
        qrCode: {
          id: existingQr.id,
          ...existingQr.data()
        }
      });
    }

    // Generate new QR code
    const qrSecret = process.env.QR_SECRET || 'shacharit-qr-secret-2024';
    const qrContent = `${currentDate}-${crypto.randomBytes(16).toString('hex')}`;
    const qrHash = crypto.createHmac('sha256', qrSecret).update(qrContent).digest('hex');

    // Set expiration to end of day (11:59 PM EST)
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const qrCodeData = {
      date: currentDate,
      code: qrHash,
      createdAt: new Date(),
      createdBy: user.uid, // Now system-generated
      isActive: true,
      expiresAt
    };

    const docRef = await adminDb.collection(COLLECTIONS.QR_CODES).add(qrCodeData);

    return NextResponse.json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: {
        id: docRef.id,
        ...qrCodeData
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
