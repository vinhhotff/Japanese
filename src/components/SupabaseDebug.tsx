import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const SupabaseDebug = () => {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    const checkConfig = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const checks: {
        hasUrl: boolean;
        hasKey: boolean;
        urlValue: string;
        keyLength: number;
        keyFormat: boolean;
        connectionTest?: string;
      } = {
        hasUrl: !!url,
        hasKey: !!key,
        urlValue: url || 'MISSING',
        keyLength: key ? key.length : 0,
        keyFormat: key ? key.split('.').length === 3 : false,
      };

      // Test connection
      try {
        const { data, error } = await supabase.from('courses').select('count').limit(1);
        checks.connectionTest = error ? `Error: ${error.message}` : 'Success';
      } catch (e: any) {
        checks.connectionTest = `Exception: ${e.message}`;
      }

      setStatus(checks);
    };

    checkConfig();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '0.875rem',
      maxWidth: '400px',
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 700 }}>🔍 Supabase Debug</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <strong>Has URL:</strong> {status.hasUrl ? '✅' : '❌'}
        </div>
        <div>
          <strong>Has Key:</strong> {status.hasKey ? '✅' : '❌'}
        </div>
        <div>
          <strong>URL:</strong> <code style={{ fontSize: '0.75rem' }}>{status.urlValue}</code>
        </div>
        <div>
          <strong>Key Length:</strong> {status.keyLength}
        </div>
        <div>
          <strong>Key Format (JWT):</strong> {status.keyFormat ? '✅' : '❌'}
        </div>
        <div>
          <strong>Connection Test:</strong> {status.connectionTest || 'Testing...'}
        </div>
      </div>
      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.8rem' }}>
        <strong>💡 Tip:</strong> Nếu có lỗi, hãy:
        <ol style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
          <li>Restart dev server</li>
          <li>Check Supabase project status</li>
          <li>Xem file SUPABASE_SETUP.md</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseDebug;
