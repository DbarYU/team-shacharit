'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatCurrentDateEST } from '@/lib/utils/dateUtils';
import { ArrowLeft, QrCode, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';

interface QRCodeData {
  id: string;
  code: string;
  date: string;
  expiresAt: any;
}

export default function QRCodePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchTodaysQR = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/qr/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.qrCode);
        setError('');
      } else {
        setQrCode(null);
        if (response.status === 404) {
          setError('No QR code generated for today yet');
        } else {
          setError(data.message || 'Failed to fetch QR code');
        }
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const generateNewQR = async () => {
    if (!user) return;
    
    try {
      setGenerating(true);
      setError('');
      const token = await user.getIdToken();
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.qrCode);
      } else {
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTodaysQR();
    }
  }, [user, fetchTodaysQR]);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      router.push('/');
    }
  }, [userProfile, router]);

  // Show loading while checking admin status
  if (!userProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show access denied if not admin
  if (!userProfile.isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                Admin privileges are required to generate QR codes.
              </p>
              <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const generateQRCodeDataURL = (text: string) => {
    // We'll use a simple library or service to generate QR codes
    // For now, let's use qr-server.com as a simple solution
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  const getFullScanURL = () => {
    if (!qrCode) return '';
    return `${window.location.origin}/scan?code=${qrCode.code}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading QR code...</p>
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

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📱 Daily QR Code</h1>
            <p className="text-xl text-gray-600">
              Attendance tracking for {formatCurrentDateEST('EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {qrCode ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Today's QR Code
                  </h2>
                  <p className="text-gray-600">
                    Have attendees scan this code to check in
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-center mb-4">
                    <img 
                      src={generateQRCodeDataURL(getFullScanURL())}
                      alt="Daily QR Code"
                      className="border-4 border-white shadow-lg rounded-lg"
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Scan URL:</p>
                    <code className="bg-gray-200 px-3 py-1 rounded text-sm break-all">
                      {getFullScanURL()}
                    </code>
                  </div>
                </div>

                {/* QR Code Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Date</span>
                    </div>
                    <p className="text-blue-700">{qrCode.date}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <QrCode className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Status</span>
                    </div>
                    <p className="text-green-700">Active</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={fetchTodaysQR}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                  
                  <Link
                    href="/scan"
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Test Scan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  No QR Code Generated Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Generate today's QR code for attendance tracking
                </p>
                
                <button
                  onClick={generateNewQR}
                  disabled={generating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mx-auto"
                >
                  <QrCode className="h-5 w-5" />
                  <span>{generating ? 'Generating...' : 'Generate QR Code'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 How it Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-gray-600">Generate or display today's QR code</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <p className="text-gray-600">Attendees scan the QR code with their phones</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <p className="text-gray-600">Attendance is automatically recorded with timestamp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
