'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPhonePage() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    brand_id: '',
    model_name: '',
    slug: '',
    release_date: '',
    release_year: '',
    main_image_url: '',
    is_published: false,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    const { data } = await supabase
      .from('brands')
      .select('id, name')
      .order('name');

    if (data) {
      setBrands(data);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'model_name' && !prev.slug ? {
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      } : {})
    }));
  }

  function handleSelectChange(value) {
    setFormData(prev => ({ ...prev, brand_id: value }));
  }

  function handleSwitchChange(checked) {
    setFormData(prev => ({ ...prev, is_published: checked }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const dataToSubmit = {
      ...formData,
      release_year: formData.release_year ? parseInt(formData.release_year) : null,
      release_date: formData.release_date || null,
    };

    const { error } = await supabase
      .from('phones')
      .insert([dataToSubmit]);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin/phones');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/phones">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Phone</h1>
          <p className="text-gray-600 mt-1">Create a new phone listing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phone Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="brand_id">Brand *</Label>
              <Select onValueChange={handleSelectChange} value={formData.brand_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_name">Model Name *</Label>
              <Input
                id="model_name"
                name="model_name"
                value={formData.model_name}
                onChange={handleChange}
                placeholder="e.g., Galaxy S24 Ultra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g., galaxy-s24-ultra"
                required
              />
              <p className="text-sm text-gray-500">URL-friendly version of the model name</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="release_year">Release Year</Label>
                <Input
                  id="release_year"
                  name="release_year"
                  type="number"
                  value={formData.release_year}
                  onChange={handleChange}
                  placeholder="2024"
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="release_date">Release Date</Label>
                <Input
                  id="release_date"
                  name="release_date"
                  type="date"
                  value={formData.release_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_image_url">Main Image URL</Label>
              <Input
                id="main_image_url"
                name="main_image_url"
                value={formData.main_image_url}
                onChange={handleChange}
                placeholder="https://example.com/phone.png"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Phone'}
              </Button>
              <Link href="/admin/phones">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
