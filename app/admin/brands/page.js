'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');

    if (!error && data) {
      setBrands(data);
    }
    setLoading(false);
  }

  async function deleteBrand(id) {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (!error) {
      loadBrands();
    }
  }

  if (loading) {
    return <div>Loading brands...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">Manage phone brands</p>
        </div>
        <Link href="/admin/brands/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Brand
          </Button>
        </Link>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No brands found. Add your first brand to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {brand.logo_url && (
                      <div className="mb-3 h-12 w-12 relative">
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <CardTitle>{brand.name}</CardTitle>
                    {brand.description && (
                      <p className="text-sm text-gray-500 mt-2">{brand.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/brands/${brand.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBrand(brand.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
