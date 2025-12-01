'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PhonesPage() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhones();
  }, []);

  async function loadPhones() {
    const { data, error } = await supabase
      .from('phones')
      .select(`
        *,
        brands (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhones(data);
    }
    setLoading(false);
  }

  async function deletePhone(id) {
    if (!confirm('Are you sure you want to delete this phone?')) return;

    const { error } = await supabase
      .from('phones')
      .delete()
      .eq('id', id);

    if (!error) {
      loadPhones();
    }
  }

  if (loading) {
    return <div>Loading phones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phones</h1>
          <p className="text-gray-600 mt-1">Manage mobile phone listings</p>
        </div>
        <Link href="/admin/phones/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Phone
          </Button>
        </Link>
      </div>

      {phones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No phones found. Add your first phone to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {phones.map((phone) => (
            <Card key={phone.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {phone.main_image_url ? (
                    <div className="w-24 h-24 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={phone.main_image_url}
                        alt={phone.model_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {phone.model_name}
                        </h3>
                        <p className="text-gray-600">{phone.brands?.name}</p>
                        {phone.release_year && (
                          <p className="text-sm text-gray-500 mt-1">Release: {phone.release_year}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={phone.is_published ? 'default' : 'secondary'}>
                          {phone.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Link href={`/admin/phones/${phone.id}/specs`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Fetch Specs
                          </Button>
                        </Link>
                        <Link href={`/admin/phones/${phone.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePhone(phone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
