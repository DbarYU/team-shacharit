import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, DEFAULT_BAGEL_TYPES, ORDER_STATUS } from '@/lib/schemas';
import { verifyToken } from '@/lib/middleware/auth';
import { getCurrentDateEST } from '@/lib/utils/dateUtils';

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

    // Check if deadline has passed (9 PM EST)
    const currentDate = getCurrentDateEST();
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const deadlineHour = 21; // 9 PM
    const deadlineMinute = 0;
    
    const deadline = new Date(estTime);
    deadline.setHours(deadlineHour, deadlineMinute, 0, 0);
    
    if (estTime >= deadline) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order deadline has passed (9 PM EST)' 
      }, { status: 400 });
    }

    // Check if user already has an order for today
    const existingOrderQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('userId', '==', user.uid)
      .where('date', '==', currentDate)
      .get();

    if (!existingOrderQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have an order for today' 
      }, { status: 400 });
    }

    const order = {
      userId: user.uid,
      date: currentDate,
      bagelType: orderData.bagelType,
      withPotatoes: orderData.withPotatoes || false,
      withCheese: orderData.withCheese || false,
      specialRequests: orderData.specialRequests || '',
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

// Get user's current order
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const currentDate = getCurrentDateEST();
    
    const orderQuery = await adminDb.collection(COLLECTIONS.DAILY_ORDERS)
      .where('userId', '==', user.uid)
      .where('date', '==', currentDate)
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
