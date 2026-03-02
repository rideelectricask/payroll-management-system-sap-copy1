import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { LogOut, Loader2, CheckCircle } from 'lucide-react';

export default function Logout() {
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        setLoading(false);
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } catch (error) {
        console.error('Logout error:', error);
        setLoading(false);
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          {loading ? (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {loading ? 'Signing Out...' : 'Signed Out Successfully'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {loading 
            ? 'Please wait while we sign you out securely' 
            : 'You have been successfully logged out'}
        </p>

        {!loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Redirecting to login page</span>
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}