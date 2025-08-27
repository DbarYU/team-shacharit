'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getOrderTargetDateEST, convertFirestoreTimestamp } from '@/lib/utils/dateUtils';
import { ArrowLeft, Coffee, Copy, Check, CheckSquare } from 'lucide-react';

interface OrderWithUser {
  id: string;
  userId: string;
  date: string;
  bagelType: string;
  withPotatoes: boolean;
  withCheese: boolean;

  dietaryNotes?: string;
  orderTimestamp: string;
  status: string;
  user: {
    displayName: string;
  };
}



export default function OrdersPage() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);

  const fetchTomorrowsOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/orders/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.message || 'Failed to fetch orders');
        }
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTomorrowsOrders();
    }
  }, [user, fetchTomorrowsOrders]);

  const confirmOrder = async (orderId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders to show updated status
        fetchTomorrowsOrders();
      } else {
        setError(data.message || 'Failed to confirm order');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      setError('Network error. Please try again.');
    }
  };

  const confirmAllOrders = async () => {
    if (!user) return;

    setConfirmingAll(true);
    try {
      const token = await user.getIdToken();
      const targetDate = getOrderTargetDateEST();
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: targetDate })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders to show updated status
        fetchTomorrowsOrders();
        // Clear any existing error
        setError('');
      } else {
        setError(data.message || 'Failed to confirm all orders');
      }
    } catch (error) {
      console.error('Error confirming all orders:', error);
      setError('Network error. Please try again.');
    } finally {
      setConfirmingAll(false);
    }
  };

  const copyToClipboard = async () => {
    const targetDate = getOrderTargetDateEST('EEEE, MMMM d, yyyy');
    let exportText = `BREAKFAST ORDERS - ${targetDate}\n`;
    exportText += `========================================\n\n`;

    orders.forEach((order, index) => {
      exportText += `${index + 1}. ${order.user.displayName}\n`;
      exportText += `   Bagel: ${order.bagelType.replace('_', ' ').toUpperCase()}\n`;
      exportText += `   With Potatoes: ${order.withPotatoes ? 'YES' : 'NO'}\n`;
      exportText += `   Cheese: ${order.cheeseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;

      exportText += `\n`;
    });

    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = exportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link 
              href="/" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Home
            </Link>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 All Orders</h1>
              <p className="text-xl text-gray-600">
                Orders for {getOrderTargetDateEST('EEEE, MMMM d, yyyy')} ({orders.length} total)
              </p>
            </div>
            
            <div className="flex space-x-3">
              {orders.length > 0 && (
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-700 text-white'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              )}

              {userProfile?.isAdmin && orders.some(order => order.status === 'pending') && (
                <button
                  onClick={confirmAllOrders}
                  disabled={confirmingAll}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      <span>Confirm All Pending</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-lg p-6">

            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders placed yet for tomorrow</p>
                <p className="text-gray-400">Orders will appear here as they come in</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                                          <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {order.user.displayName}
                          </h3>
                          {order.status === 'confirmed' && (
                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                              <Check className="h-3 w-3" />
                              <span>Confirmed</span>
                            </div>
                          )}
                        </div>
                      <div className="text-sm text-gray-500">
                        {convertFirestoreTimestamp(order.orderTimestamp).toLocaleTimeString('en-US', {
                          timeZone: 'America/New_York',
                          hour: 'numeric',
                          minute: '2-digit'
                        })} EST
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Bagel:</span>
                        <p className="text-gray-900">
                          {order.bagelType.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Potatoes:</span>
                        <p className={order.withPotatoes ? 'text-green-600' : 'text-gray-500'}>
                          {order.withPotatoes ? 'Yes' : 'No'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Cheese:</span>
                        <p className={order.cheeseType === 'no_cheese' ? 'text-gray-500' : 'text-green-600'}>
                          {order.cheeseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <p className={`capitalize font-medium ${
                            order.status === 'confirmed'
                              ? 'text-green-600'
                              : order.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }`}>
                            {order.status}
                          </p>
                        </div>
                        {userProfile?.isAdmin && order.status === 'pending' && (
                          <button
                            onClick={() => confirmOrder(order.id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            <span>Confirm</span>
                          </button>
                        )}
                      </div>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-6 text-center">
            <button
              onClick={fetchTomorrowsOrders}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Orders'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
