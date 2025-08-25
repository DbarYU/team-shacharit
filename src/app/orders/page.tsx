'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatCurrentDateEST } from '@/lib/utils/dateUtils';
import { ArrowLeft, Coffee, Copy } from 'lucide-react';

interface OrderWithUser {
  id: string;
  userId: string;
  date: string;
  bagelType: string;
  withPotatoes: boolean;
  withCheese: boolean;
  specialRequests?: string;
  dietaryNotes?: string;
  orderTimestamp: string;
  status: string;
  user: {
    displayName: string;
  };
}



export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTodaysOrders = useCallback(async () => {
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
      fetchTodaysOrders();
    }
  }, [user, fetchTodaysOrders]);

  const copyToClipboard = async () => {
    const currentDate = formatCurrentDateEST('EEEE, MMMM d, yyyy');
    let exportText = `BREAKFAST ORDERS - ${currentDate}\n`;
    exportText += `========================================\n\n`;
    exportText += `Total Orders: ${orders.length}\n\n`;

    orders.forEach((order, index) => {
      const orderTime = new Date(order.orderTimestamp).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit'
      });

      exportText += `${index + 1}. ${order.user.displayName}\n`;
      exportText += `   Ordered at: ${orderTime} EST\n`;
      exportText += `   Bagel: ${order.bagelType.replace('_', ' ').toUpperCase()}\n`;
      exportText += `   With Potatoes: ${order.withPotatoes ? 'YES' : 'NO'}\n`;
      exportText += `   With Cheese: ${order.withCheese ? 'YES' : 'NO'}\n`;
      if (order.specialRequests) {
        exportText += `   Special Requests: ${order.specialRequests}\n`;
      }
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
                Orders for {formatCurrentDateEST('EEEE, MMMM d, yyyy')} ({orders.length} total)
              </p>
            </div>
            
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
                <p className="text-gray-500 text-lg">No orders placed yet today</p>
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
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.orderTimestamp).toLocaleTimeString('en-US', {
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
                        <p className={order.withCheese ? 'text-green-600' : 'text-gray-500'}>
                          {order.withCheese ? 'Yes' : 'No'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-blue-600 capitalize">{order.status}</p>
                      </div>
                    </div>

                    {order.specialRequests && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="font-medium text-gray-700">Special Requests:</span>
                        <p className="text-gray-900 mt-1">{order.specialRequests}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-6 text-center">
            <button
              onClick={fetchTodaysOrders}
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
