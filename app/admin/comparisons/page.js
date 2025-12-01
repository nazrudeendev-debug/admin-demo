'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisons();
  }, []);

  async function loadComparisons() {
    const { data } = await supabase
      .from('comparisons')
      .select(`
        *,
        comparison_phones (
          phones (
            model_name,
            brands (name)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setComparisons(data);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comparisons</h1>
          <p className="text-gray-600 mt-1">Phone comparison tool</p>
        </div>
        <Link href="/admin/comparisons/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Comparison
          </Button>
        </Link>
      </div>

      {comparisons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No comparisons yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comparisons.map((comp) => (
            <Card key={comp.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{comp.title}</h3>
                      <Badge variant={comp.is_published ? 'default' : 'secondary'}>
                        {comp.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {comp.comparison_phones.length} phones
                    </p>
                  </div>
                  <Link href={`/admin/comparisons/${comp.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
