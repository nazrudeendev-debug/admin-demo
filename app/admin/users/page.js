'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UsersPage() {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [role]);

  async function loadUsers() {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  }

  async function updateUserRole(userId, newRole) {
    setUpdating(true);
    setMessage('');

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      setMessage('Failed to update role');
    } else {
      setMessage('Role updated successfully');
      loadUsers();
    }

    setUpdating(false);
  }

  if (loading) return <div>Loading...</div>;

  if (role !== 'admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
        <Alert>
          <AlertDescription>Only administrators can manage users.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
        <p className="text-gray-600 mt-1">Manage user permissions</p>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.user_id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{user.role}</Badge>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
                      disabled={updating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Badge className="mb-2">Admin</Badge>
            <p className="text-sm text-gray-600">Full access to all features including delete and settings</p>
          </div>
          <div>
            <Badge variant="secondary" className="mb-2">Editor</Badge>
            <p className="text-sm text-gray-600">Can create and edit content but cannot delete or change settings</p>
          </div>
          <div>
            <Badge variant="outline" className="mb-2">Viewer</Badge>
            <p className="text-sm text-gray-600">Read-only access to view all data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
