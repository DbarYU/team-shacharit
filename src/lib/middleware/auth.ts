import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/schemas';

export async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    // Get or create user in Firestore
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update last login
      await userRef.update({
        lastLoginAt: new Date()
      });
      return { uid: decodedToken.uid, ...userDoc.data() };
    } else {
      // Create new user
      const newUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email?.split('@')[0],
        phoneNumber: decodedToken.phone_number || null,
        dietaryRestrictions: [],
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      await userRef.set(newUser);
      return newUser;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
