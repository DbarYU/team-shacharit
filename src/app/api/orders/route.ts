import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, DEFAULT_BAGEL_TYPES, ORDER_STATUS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getOrderTargetDateEST, areOrdersAllowed } from '@/lib/utils/dateUtils';

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const orderData = await request.json();

    // Validate required fields
    if (!orderData.bagelType || !DEFAULT_BAGEL_TYPES.includes(orderData.bagelType)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid bagel type' 
      }, { status: 400 });
    }

    // Check if orders are currently allowed (9 AM to 9 PM EST)
    const orderCheck = areOrdersAllowed();
    if (!orderCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: orderCheck.message 
      }, { status: 400 });
    }

    // Get target date for order (next day)
    const targetDate = getOrderTargetDateEST();

    // Check if user already has an order for the target date
    const existingOrderQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('userId', '==', user.uid)
      .where('date', '==', targetDate)
      .get();

    if (!existingOrderQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have an order for tomorrow' 
      }, { status: 400 });
    }

    const order = {
      userId: user.uid,
      date: targetDate,
      bagelType: orderData.bagelType,
      withPotatoes: orderData.withPotatoes || false,
      withCheese: orderData.withCheese || false,
      dietaryNotes: orderData.dietaryNotes || '',
      orderTimestamp: new Date(),
      status: ORDER_STATUS.PENDING
    };

    const docRef = await adminDb.collection(COLLECTIONS.DAILY_ORDERS).add(order);
    
    // Simplified - no email confirmations needed

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: docRef.id,
        ...order
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Get user's current order for tomorrow
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const targetDate = getOrderTargetDateEST();
    
    const orderQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('userId', '==', user.uid)
      .where('date', '==', targetDate)
      .get();

    if (orderQuery.empty) {
      return NextResponse.json({ 
        success: true, 
        order: null 
      });
    }

    const orderDoc = orderQuery.docs[0];
    return NextResponse.json({
      success: true,
      order: {
        id: orderDoc.id,
        ...orderDoc.data()
      }
    });

  } catch (error) {
    console.error('Error getting order:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Confirm an order (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!('isAdmin' in user) || !user.isAdmin || user.isAdmin !== true) {
      return NextResponse.json({ success: false, message: 'Admin privileges required' }, { status: 403 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });
    }

    // Update order status to confirmed
    await adminDb.collection(COLLECTIONS.DAILY_ORDERS).doc(orderId).update({
      status: ORDER_STATUS.CONFIRMED
    });

    return NextResponse.json({
      success: true,
      message: 'Order confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Confirm all pending orders (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!('isAdmin' in user) || !user.isAdmin || user.isAdmin !== true) {
      return NextResponse.json({ success: false, message: 'Admin privileges required' }, { status: 403 });
    }

    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ success: false, message: 'Date required' }, { status: 400 });
    }

    // Get all pending orders for the specified date
    const pendingOrdersQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('date', '==', date)
      .where('status', '==', ORDER_STATUS.PENDING)
      .get();

    if (pendingOrdersQuery.empty) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders found to confirm',
        confirmedCount: 0
      });
    }

    // Confirm each order individually
    const orderIds = pendingOrdersQuery.docs.map(doc => doc.id);
    let confirmedCount = 0;
    const failedOrders: string[] = [];

    for (const orderId of orderIds) {
      try {
        await adminDb.collection(COLLECTIONS.DAILY_ORDERS).doc(orderId).update({
          status: ORDER_STATUS.CONFIRMED
        });
        confirmedCount++;
      } catch (error) {
        console.error(`Error confirming order ${orderId}:`, error);
        failedOrders.push(orderId);
      }
    }

    // Prepare response message
    let message = `Successfully confirmed ${confirmedCount} orders`;
    if (failedOrders.length > 0) {
      message += ` (${failedOrders.length} failed)`;
    }

    return NextResponse.json({
      success: true,
      message,
      confirmedCount,
      failedCount: failedOrders.length,
      totalOrders: orderIds.length
    });

  } catch (error) {
    console.error('Error confirming all orders:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
