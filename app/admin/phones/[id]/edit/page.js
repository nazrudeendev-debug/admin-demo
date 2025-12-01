'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Download, DollarSign, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditPhonePage() {
  const router = useRouter();
  const params = useParams();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
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
    loadPhone();
  }, [params.id]);

  async function loadBrands() {
    const { data } = await supabase
      .from('brands')
      .select('id, name')
      .order('name');

    if (data) {
      setBrands(data);
    }
  }

  async function loadPhone() {
    const { data: phoneData, error: phoneError } = await supabase
      .from('phones')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (phoneError || !phoneData) {
      router.push('/admin/phones');
      return;
    }

    setFormData({
      brand_id: phoneData.brand_id || '',
      model_name: phoneData.model_name || '',
      slug: phoneData.slug || '',
      release_date: phoneData.release_date || '',
      release_year: phoneData.release_year?.toString() || '',
      main_image_url: phoneData.main_image_url || '',
      is_published: phoneData.is_published || false,
    });

    const { data: imagesData } = await supabase
      .from('phone_images')
      .select('*')
      .eq('phone_id', params.id)
      .order('display_order');

    if (imagesData) {
      setGalleryImages(imagesData);
    }

    setLoadingData(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    setSuccess('');

    const dataToSubmit = {
      ...formData,
      release_year: formData.release_year ? parseInt(formData.release_year) : null,
      release_date: formData.release_date || null,
    };

    const { error } = await supabase
      .from('phones')
      .update(dataToSubmit)
      .eq('id', params.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Phone updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }

    setLoading(false);
  }

  async function addGalleryImage() {
    if (!newImageUrl.trim()) return;
    
    const { error } = await supabase
      .from('phone_images')
      .insert({
        phone_id: params.id,
        image_url: newImageUrl.trim(),
        display_order: galleryImages.length,
      });

    if (!error) {
      setNewImageUrl('');
      loadPhone();
    }
  }

  async function removeGalleryImage(imageId) {
    if (!confirm('Remove this image from gallery?')) return;

    await supabase
      .from('phone_images')
      .delete()
      .eq('id', imageId);

    loadPhone();
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading phone...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/phones">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit Phone</h1>
          <p className="text-gray-600 mt-1">{formData.model_name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/phones/${params.id}/specs`}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Fetch Specs
            </Button>
          </Link>
          <Link href={`/admin/prices?phone=${params.id}`}>
            <Button variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Prices
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Phone Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
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
                </div>

                <div className="grid grid-cols-2 gap-6">
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
                </div>

                <div className="grid grid-cols-2 gap-6">
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
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    Published
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
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
        </TabsContent>

        <TabsContent value="images">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Main Image</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.main_image_url ? (
                  <div className="flex items-start gap-6">
                    <div className="w-48 h-48 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={formData.main_image_url}
                        alt={formData.model_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 break-all">{formData.main_image_url}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setFormData(prev => ({ ...prev, main_image_url: '' }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No main image set</p>
                    <p className="text-sm">Add an image URL in the Basic Info tab</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addGalleryImage} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Image
                  </Button>
                </div>

                {galleryImages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No gallery images yet</p>
                    <p className="text-sm">Add image URLs above to build the gallery</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={image.image_url}
                            alt="Gallery image"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
