import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, DailyOrder } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getCurrentDateEST } from '@/lib/utils/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const currentDate = getCurrentDateEST();

    // Get all orders for today
    const ordersQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('date', '==', currentDate)
      .get();

    const orders = ordersQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DailyOrder[];

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
    enhancedOrders.sort((a, b) => new Date(a.orderTimestamp).getTime() - new Date(b.orderTimestamp).getTime());

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
