import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/actions/order.actions';
import { Order } from '@/lib/database/models/models';

export async function GET(request: NextRequest) {
  try {
    const tempOrderId = request.nextUrl.searchParams.get('orderId');
    
    if (!tempOrderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // First try to find the order by the temporary ID in the payment data
    const order = await Order.findOne({
      'payment_data.tempOrderId': tempOrderId
    }).lean();

    if (!order) {
      // If no order is found, payment is still pending
      return NextResponse.json({ status: 'pending' });
    }

    // If we found an order, payment was successful
    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
} 