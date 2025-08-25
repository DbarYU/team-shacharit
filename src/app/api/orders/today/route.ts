import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, DailyOrder } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getOrderTargetDateEST, convertFirestoreTimestamp } from '@/lib/utils/dateUtils';

// Helper function to convert Firestore document data
const convertDocumentData = (doc: any) => {
  const data = doc.data();
  // Convert any Firestore timestamps to JavaScript Dates
  if (data.orderTimestamp) {
    data.orderTimestamp = convertFirestoreTimestamp(data.orderTimestamp);
  }
  return {
    id: doc.id,
    ...data
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const targetDate = getOrderTargetDateEST();

    // Get all orders for tomorrow
    const ordersQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('date', '==', targetDate)
      .get();

    const orders = ordersQuery.docs.map(convertDocumentData) as DailyOrder[];

    // Get user details for each order
    const userIds = [...new Set(orders.map(order => order.userId))];
    const usersQuery = await adminDb.collection(COLLECTIONS.USERS)
      .where('uid', 'in', userIds.length > 0 ? userIds : ['dummy'])
      .get();

    const usersMap = new Map();
    usersQuery.docs.forEach(doc => {
      usersMap.set(doc.id, doc.data());
    });

    // Enhance orders with user info
    const enhancedOrders = orders.map(order => ({
      ...order,
      user: usersMap.get(order.userId) || { displayName: 'Unknown User' }
    }));

    // Sort by order timestamp
    enhancedOrders.sort((a, b) => {
      const timeA = convertFirestoreTimestamp(a.orderTimestamp).getTime();
      const timeB = convertFirestoreTimestamp(b.orderTimestamp).getTime();
      return timeA - timeB;
    });

    // Create summary
    const summary = {
      totalOrders: enhancedOrders.length,
      bagelBreakdown: {},
      withPotatoes: 0,
      withCheese: 0
    };

    enhancedOrders.forEach(order => {
      // Count bagel types
      summary.bagelBreakdown[order.bagelType] = (summary.bagelBreakdown[order.bagelType] || 0) + 1;
      
      // Count add-ons
      if (order.withPotatoes) summary.withPotatoes++;
      if (order.withCheese) summary.withCheese++;
    });

    return NextResponse.json({
      success: true,
      orders: enhancedOrders,
      summary
    });

  } catch (error) {
    console.error('Error getting daily orders:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
