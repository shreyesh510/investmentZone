import React, { useState, useEffect } from 'react';
import getAxios from '../utils/interceptor/axiosInterceptor';

const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setStatus('loading');
    setError('');
    
    try {
      console.log('🧪 Testing backend connection...');
      const response = await getAxios.get('/health');
      setData(response.data);
      setStatus('success');
      console.log('✅ Backend connection successful:', response.data);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      setStatus('error');
      console.error('❌ Backend connection failed:', err);
    }
  };

  useEffect(() => {
    // Test connection on component mount
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Backend Connection Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            status === 'success' ? 'bg-green-100 text-green-800' :
            status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
        
        {status === 'loading' && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Testing connection...</span>
          </div>
        )}
        
        {status === 'success' && data && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-green-800 font-medium">{data.message}</p>
            <p className="text-green-600 text-sm">Timestamp: {data.timestamp}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-800 font-medium">Connection Failed</p>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-red-600 text-sm mt-2">
              Make sure the backend is running on http://localhost:3000
            </p>
          </div>
        )}
        
        <button
          onClick={testConnection}
          disabled={status === 'loading'}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Connection Again
        </button>
      </div>
    </div>
  );
};

export default ConnectionTest;
