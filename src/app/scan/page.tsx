'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatCurrentDateEST } from '@/lib/utils/dateUtils';
import { ArrowLeft, QrCode, CheckCircle, AlertCircle, Clock } from 'lucide-react';

function ScanPageContent() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleScan = useCallback(async (qrCode: string) => {
    if (!user) return;
    
    setLoading(true);
    setResult(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrCode })
      });

      const data = await response.json();
      
      setResult({
        success: data.success,
        message: data.message,
        timestamp: data.success ? new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        }) : undefined
      });

    } catch (error) {
      console.error('Error scanning QR code:', error);
      setResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if there's a QR code in the URL params (from scanning)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && user) {
      handleScan(codeFromUrl);
    }
  }, [searchParams, user, handleScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
    }
  };

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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📱 Check In</h1>
            <p className="text-xl text-gray-600">
              Scan QR code for {formatCurrentDateEST('EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing check-in...</p>
              </div>
            )}

            {/* Result Display */}
            {result && !loading && (
              <div className={`rounded-lg shadow-lg p-8 text-center mb-6 ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-green-900 mb-2">
                      ✅ Check-in Successful!
                    </h2>
                    <p className="text-green-700 mb-4">{result.message}</p>
                    
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Checked in at {result.timestamp} EST</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        Welcome, {userProfile?.displayName}!
                      </p>
                    </div>

                    <button
                      onClick={() => router.push('/')}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Back to Home
                    </button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-red-900 mb-2">
                      ❌ Check-in Failed
                    </h2>
                    <p className="text-red-700 mb-4">{result.message}</p>
                    
                    <button
                      onClick={() => setResult(null)}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Manual Entry Form */}
            {!result && !loading && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Manual Check-in
                  </h2>
                  <p className="text-gray-600">
                    Enter the QR code manually or scan with your camera
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter QR code here..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check In
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">Or use your phone&apos;s camera:</p>
                  <button
                    onClick={() => {
                      // This would typically open the camera scanner
                      // For now, we'll show instructions
                      alert('To scan with camera:\n1. Open your phone&apos;s camera app\n2. Point at the QR code\n3. Tap the link that appears\n4. You&apos;ll be redirected here automatically');
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                  >
                    📸 How to scan with camera
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Check-in Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <p>Scan the QR code displayed at the event or enter it manually above</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <p>Your attendance will be recorded with the current timestamp</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">3</span>
                </div>
                <p>You can only check in once per day</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
