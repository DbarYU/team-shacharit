import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, User } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userData = user as Partial<User>; // Type assertion to handle the union type
    return NextResponse.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        dietaryRestrictions: userData.dietaryRestrictions || [],
        isAdmin: userData.isAdmin || false,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { displayName, phoneNumber, dietaryRestrictions } = await request.json();

    const updatedData = {
      displayName,
      phoneNumber,
      dietaryRestrictions: dietaryRestrictions || [],
      updatedAt: new Date()
    };

    await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).update(updatedData);

    const userData = { ...user, ...updatedData } as Partial<User>; // Type assertion to handle the union type

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        dietaryRestrictions: userData.dietaryRestrictions || [],
        isAdmin: userData.isAdmin || false,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
