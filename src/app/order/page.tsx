'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DEFAULT_BAGEL_TYPES, CHEESE_OPTIONS, DailyOrder } from '@/lib/schemas';
import { getOrderTargetDateEST, areOrdersAllowed } from '@/lib/utils/dateUtils';

export default function OrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    bagelType: 'plain',
    withPotatoes: false,
    cheeseType: 'no_cheese',
    dietaryNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingOrder, setExistingOrder] = useState<DailyOrder | null>(null);

  const checkExistingOrder = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.order) {
          setExistingOrder(data.order);
        }
      }
    } catch (error) {
      console.error('Error checking existing order:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingOrder();
    }
  }, [user, checkExistingOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Check if orders are allowed
    const orderCheck = areOrdersAllowed();
    if (!orderCheck.allowed) {
      setError(orderCheck.message || 'Orders are not currently allowed');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        router.push('/orders');
      } else {
        setError(data.message || 'Failed to create order');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (existingOrder) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
          <div className="container mx-auto max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                ✅ Order Already Placed
              </h1>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h2 className="font-semibold text-green-800 mb-4">Your order for today:</h2>
                <div className="space-y-2 text-green-700">
                  <p><strong>Bagel:</strong> {existingOrder.bagelType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>With Potatoes:</strong> {existingOrder.withPotatoes ? 'Yes' : 'No'}</p>
                  <p><strong>With Cheese:</strong> {existingOrder.withCheese ? 'Yes' : 'No'}</p>

                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              🥯 Place Your Order
            </h1>
            <p className="text-gray-600 text-center mb-6">
              For tomorrow: {getOrderTargetDateEST('EEEE, MMMM d, yyyy')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bagel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bagel Type *
                </label>
                <select
                  value={formData.bagelType}
                  onChange={(e) => setFormData({ ...formData, bagelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {DEFAULT_BAGEL_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add-ons */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Add-ons</h3>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.withPotatoes}
                    onChange={(e) => setFormData({ ...formData, withPotatoes: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">With Potatoes</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cheese Options
                  </label>
                  <select
                    value={formData.cheeseType}
                    onChange={(e) => setFormData({ ...formData, cheeseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CHEESE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>



              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>⏰ Orders must be placed by 9:00 PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
