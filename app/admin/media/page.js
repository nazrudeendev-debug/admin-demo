'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Upload, Trash2, Copy, Check, Search, X } from 'lucide-react';
import Image from 'next/image';

export default function MediaPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    setLoading(true);
    
    const [phoneImagesResult, brandsResult] = await Promise.all([
      supabase.from('phone_images').select('id, image_url, created_at, phone_id, phones(model_name, brands(name))').order('created_at', { ascending: false }),
      supabase.from('brands').select('id, name, logo_url').order('name'),
    ]);

    const allImages = [];

    if (phoneImagesResult.data) {
      phoneImagesResult.data.forEach(img => {
        allImages.push({
          id: `phone-${img.id}`,
          url: img.image_url,
          type: 'phone',
          name: img.phones ? `${img.phones.brands?.name} ${img.phones.model_name}` : 'Phone Image',
          created_at: img.created_at,
          sourceId: img.id,
          sourceTable: 'phone_images',
        });
      });
    }

    if (brandsResult.data) {
      brandsResult.data.forEach(brand => {
        if (brand.logo_url) {
          allImages.push({
            id: `brand-${brand.id}`,
            url: brand.logo_url,
            type: 'brand',
            name: `${brand.name} Logo`,
            created_at: null,
            sourceId: brand.id,
            sourceTable: 'brands',
          });
        }
      });
    }

    const phonesWithMainImages = await supabase
      .from('phones')
      .select('id, model_name, main_image_url, brands(name)')
      .not('main_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (phonesWithMainImages.data) {
      phonesWithMainImages.data.forEach(phone => {
        if (phone.main_image_url) {
          allImages.push({
            id: `main-${phone.id}`,
            url: phone.main_image_url,
            type: 'phone',
            name: `${phone.brands?.name} ${phone.model_name} (Main)`,
            created_at: null,
            sourceId: phone.id,
            sourceTable: 'phones',
          });
        }
      });
    }

    setImages(allImages);
    setLoading(false);
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          setError('Storage bucket not configured. Please set up Supabase Storage first.');
        } else {
          throw uploadError;
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        setSuccess(`Image uploaded! URL: ${publicUrl}`);
        loadImages();
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    }

    setUploading(false);
    event.target.value = '';
  }

  async function copyUrl(url, id) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError('Failed to copy URL');
    }
  }

  async function deleteImage(image) {
    let confirmMsg = 'Delete this image?';
    if (image.sourceTable === 'phone_images') {
      confirmMsg = 'Remove this gallery image?';
    } else if (image.sourceTable === 'brands') {
      confirmMsg = 'Remove this brand logo? (The brand itself will NOT be deleted)';
    } else if (image.sourceTable === 'phones') {
      confirmMsg = 'Remove the main image from this phone? (The phone itself will NOT be deleted)';
    }

    if (!confirm(confirmMsg)) return;

    try {
      if (image.sourceTable === 'phone_images') {
        await supabase.from('phone_images').delete().eq('id', image.sourceId);
        setSuccess('Gallery image removed');
        loadImages();
      } else if (image.sourceTable === 'brands') {
        await supabase.from('brands').update({ logo_url: null }).eq('id', image.sourceId);
        setSuccess('Brand logo cleared (brand still exists)');
        loadImages();
      } else if (image.sourceTable === 'phones') {
        await supabase.from('phones').update({ main_image_url: null }).eq('id', image.sourceId);
        setSuccess('Main image cleared (phone still exists)');
        loadImages();
      }
    } catch (err) {
      setError('Failed to update image');
    }
  }

  const filteredImages = images.filter(img => {
    if (filter !== 'all' && img.type !== filter) return false;
    if (searchQuery && !img.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !img.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading media...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">Manage all images ({filteredImages.length} of {images.length})</p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <Button className="gap-2" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="break-all">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="phone">Phone Images</SelectItem>
                <SelectItem value="brand">Brand Logos</SelectItem>
              </SelectContent>
            </Select>
            {(filter !== 'all' || searchQuery) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setFilter('all'); setSearchQuery(''); }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {images.length === 0 ? 'No images in library' : 'No images match your filters'}
            </p>
            <p className="text-sm text-gray-400">
              Images from phones and brands will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="group overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => copyUrl(image.url, image.id)}
                    title="Copy URL"
                  >
                    {copiedId === image.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteImage(image)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={image.name}>
                  {image.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {image.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Upload images using the button above (requires Supabase Storage bucket named "media")</p>
          <p>2. Or add image URLs directly when editing phones, brands, or articles</p>
          <p>3. Hover over any image to copy its URL or delete it</p>
          <p>4. Use the filter to view specific image types</p>
        </CardContent>
      </Card>
    </div>
  );
}
