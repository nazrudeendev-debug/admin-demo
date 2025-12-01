'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode } from 'lucide-react';

export default function ApiLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    const { data } = await supabase
      .from('api_import_logs')
      .select(`
        *,
        phones (
          model_name,
          brands (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) setLogs(data);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Import Logs</h1>
        <p className="text-gray-600 mt-1">View specification import history</p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No API imports yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {log.phones ? `${log.phones.brands.name} ${log.phones.model_name}` : 'Unknown Phone'}
                    </p>
                    <p className="text-sm text-gray-500">{log.api_source}</p>
                  </div>
                  <Badge
                    variant={
                      log.status === 'success'
                        ? 'default'
                        : log.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
                {log.message && (
                  <p className="text-sm text-gray-600">{log.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
