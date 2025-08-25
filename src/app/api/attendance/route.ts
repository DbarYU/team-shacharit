import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { formatFirestoreTimestamp } from '@/lib/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get the date parameter, default to today
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Query attendance records
    let query = adminDb.collection(COLLECTIONS.ATTENDANCE);

    if (date) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.where('date', '==', date) as any;
    }

    const attendanceSnapshot = await query
      .get();

    // Sort by checkInTime in memory since we can't create the index right now
    const sortedDocs = attendanceSnapshot.docs.sort((a, b) => {
      const aData = a.data();
      const bData = b.data();
      return bData.checkInTime.toDate().getTime() - aData.checkInTime.toDate().getTime();
    });

    // Get all unique user IDs
    const userIds = [...new Set(sortedDocs.map(doc => doc.data().userId))];

    // Fetch user profiles for all attendees
    const userProfiles = await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
        return {
          id: userId,
          ...userDoc.data()
        };
      })
    );

    // Create a map for quick user lookup
    const userMap = new Map(userProfiles.map(user => [user.id, user]));

    // Combine attendance with user data
    const attendanceRecords = sortedDocs.map(doc => {
      const data = doc.data();
      const userProfile = userMap.get(data.userId);

      return {
        id: doc.id,
        ...data,
        checkInTime: formatFirestoreTimestamp(data.checkInTime, 'MMM d, yyyy h:mm a'),
        user: {
          id: data.userId,
          displayName: userProfile?.displayName || 'Unknown User',
          email: userProfile?.email || 'Unknown Email'
        }
      };
    });

    return NextResponse.json({
      success: true,
      attendance: attendanceRecords,
      totalCount: attendanceRecords.length
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
