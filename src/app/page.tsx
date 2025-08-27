'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getOrderTargetDateEST } from '@/lib/utils/dateUtils';
import { QrCode, Users, Coffee, BarChart3 } from 'lucide-react';
import { DailyOrder } from '@/lib/schemas';

export default function HomePage() {
  const { userProfile, user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<DailyOrder | null>(null);

  const fetchCurrentOrder = useCallback(async () => {
    try {
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentOrder(data.order);
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCurrentOrder();
    }
  }, [user, fetchCurrentOrder]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🥯 Team Shacharit</h1>
            <p className="text-xl text-gray-600">Breakfast Orders for {getOrderTargetDateEST('EEEE, MMMM d, yyyy')}</p>
          </div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome back, {userProfile?.displayName}! 👋
            </h2>
            
            {currentOrder ? (
              <div className={`border rounded-lg p-4 ${
                currentOrder.status === 'confirmed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${
                    currentOrder.status === 'confirmed'
                      ? 'text-green-800'
                      : 'text-yellow-800'
                  }`}>
                    {currentOrder.status === 'confirmed'
                      ? '✅ Your order is confirmed for tomorrow!'
                      : '⏳ Your order is pending for tomorrow'
                    }
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    currentOrder.status === 'confirmed'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {currentOrder.status.toUpperCase()}
                  </span>
                </div>
                <div className={
                  currentOrder.status === 'confirmed'
                    ? 'text-green-700'
                    : 'text-yellow-700'
                }>
                  <p><strong>Bagel:</strong> {currentOrder.bagelType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>With Potatoes:</strong> {currentOrder.withPotatoes ? 'Yes' : 'No'}</p>
                  <p><strong>Cheese:</strong> {currentOrder.cheeseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">⏰ You haven&apos;t ordered yet for tomorrow</h3>
                <p className="text-yellow-700">Order deadline: 9:00 PM EST</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${userProfile?.isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            <Link href="/order" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <div className="flex items-center space-x-4">
                <Coffee className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Place Order</h3>
                  <p className="text-gray-600 text-sm">Order your breakfast</p>
                </div>
              </div>
            </Link>

            <Link href="/scan" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <div className="flex items-center space-x-4">
                <QrCode className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Scan QR Code</h3>
                  <p className="text-gray-600 text-sm">Check in for attendance</p>
                </div>
              </div>
            </Link>

            <Link href="/orders" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">All Orders</h3>
                  <p className="text-gray-600 text-sm">See everyone&apos;s orders</p>
                </div>
              </div>
            </Link>

            <Link href="/attendance" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <div className="flex items-center space-x-4">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Attendance</h3>
                  <p className="text-gray-600 text-sm">View check-in records</p>
                </div>
              </div>
            </Link>

            {/* Admin-only QR Generation */}
            {userProfile?.isAdmin && (
              <Link href="/qr" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block">
                <div className="flex items-center space-x-4">
                  <QrCode className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Generate QR</h3>
                    <p className="text-gray-600 text-sm">Daily attendance QR code</p>
                  </div>
                </div>
              </Link>
            )}
          </div>


        </div>
      </div>
    </ProtectedRoute>
  );
}