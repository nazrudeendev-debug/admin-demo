'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Download, DollarSign, Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PhonesPage() {
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    brand: 'all',
    status: 'all',
    year: 'all',
  });

  useEffect(() => {
    loadBrands();
    loadPhones();
  }, []);

  async function loadBrands() {
    const { data } = await supabase.from('brands').select('id, name').order('name');
    if (data) setBrands(data);
  }

  async function loadPhones() {
    const { data, error } = await supabase
      .from('phones')
      .select(`
        *,
        brands (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhones(data);
      
      const phoneIds = data.map(p => p.id);
      if (phoneIds.length > 0) {
        const { data: pricesData } = await supabase
          .from('prices')
          .select('phone_id, currency, amount, region')
          .in('phone_id', phoneIds)
          .eq('is_current', true);
        
        if (pricesData) {
          const priceMap = {};
          pricesData.forEach(p => {
            if (!priceMap[p.phone_id] || p.region === 'Philippines') {
              priceMap[p.phone_id] = p;
            }
          });
          setPrices(priceMap);
        }
      }
    }
    setLoading(false);
  }

  async function deletePhone(id) {
    if (!confirm('Are you sure you want to delete this phone? This will also delete all specs, prices, and images.')) return;

    const { error } = await supabase
      .from('phones')
      .delete()
      .eq('id', id);

    if (!error) {
      loadPhones();
    }
  }

  const years = [...new Set(phones.map(p => p.release_year).filter(Boolean))].sort((a, b) => b - a);

  const filteredPhones = phones.filter(phone => {
    if (filters.search && !phone.model_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !phone.brands?.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.brand !== 'all' && phone.brand_id !== filters.brand) {
      return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'published' && !phone.is_published) return false;
      if (filters.status === 'draft' && phone.is_published) return false;
    }
    if (filters.year !== 'all' && phone.release_year !== parseInt(filters.year)) {
      return false;
    }
    return true;
  });

  function clearFilters() {
    setFilters({ search: '', brand: 'all', status: 'all', year: 'all' });
  }

  const hasActiveFilters = filters.search || filters.brand !== 'all' || filters.status !== 'all' || filters.year !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading phones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phones</h1>
          <p className="text-gray-600 mt-1">Manage mobile phone listings ({filteredPhones.length} of {phones.length})</p>
        </div>
        <Link href="/admin/phones/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Phone
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search phones..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-[180px]">
              <Select value={filters.brand} onValueChange={(value) => setFilters(prev => ({ ...prev, brand: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[130px]">
              <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredPhones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {phones.length === 0 
                ? 'No phones found. Add your first phone to get started.' 
                : 'No phones match your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Price (PH)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhones.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell>
                      {phone.main_image_url ? (
                        <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={phone.main_image_url}
                            alt={phone.model_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{phone.brands?.name}</TableCell>
                    <TableCell>
                      <Link href={`/admin/phones/${phone.id}/edit`} className="hover:underline">
                        {phone.model_name}
                      </Link>
                    </TableCell>
                    <TableCell>{phone.release_year || '-'}</TableCell>
                    <TableCell>
                      {prices[phone.id] ? (
                        <span className="font-medium">
                          {prices[phone.id].currency} {Number(prices[phone.id].amount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={phone.is_published ? 'default' : 'secondary'}>
                        {phone.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/phones/${phone.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/phones/${phone.id}/specs`}>
                          <Button variant="ghost" size="icon" title="Specs">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/prices?phone=${phone.id}`}>
                          <Button variant="ghost" size="icon" title="Prices">
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePhone(phone.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
