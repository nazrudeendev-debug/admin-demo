'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Save, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PhoneSpecsPage() {
  const router = useRouter();
  const params = useParams();
  const [phone, setPhone] = useState(null);
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPhoneAndSpecs();
  }, [params.id]);

  async function loadPhoneAndSpecs() {
    const { data: phoneData } = await supabase
      .from('phones')
      .select('*, brands(name)')
      .eq('id', params.id)
      .maybeSingle();

    const { data: specsData } = await supabase
      .from('specifications')
      .select('*')
      .eq('phone_id', params.id)
      .order('category')
      .order('display_order');

    if (phoneData) setPhone(phoneData);
    if (specsData) setSpecs(specsData);
    setLoadingData(false);
  }

  async function fetchFromAPI() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const searchQuery = `${phone.brands.name} ${phone.model_name}`.toLowerCase();
      const response = await fetch(`https://mobile-api.dev/api/v1/phones?search=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }

      const data = await response.json();

      if (!data || !data.data || data.data.length === 0) {
        throw new Error('Phone not found in API');
      }

      const phoneData = data.data[0];
      const newSpecs = [];

      Object.entries(phoneData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue !== null && subValue !== undefined && subValue !== '') {
              newSpecs.push({
                category: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                spec_key: subKey,
                spec_value: String(subValue),
                source: 'api',
                display_order: newSpecs.length,
              });
            }
          });
        } else if (value !== null && value !== undefined && value !== '' && key !== 'id') {
          newSpecs.push({
            category: 'General',
            spec_key: key,
            spec_value: String(value),
            source: 'api',
            display_order: newSpecs.length,
          });
        }
      });

      setSpecs(newSpecs);
      setSuccess(`Fetched ${newSpecs.length} specifications from API. Review and edit below, then save.`);

      const user = await getCurrentUser();
      await supabase.from('api_import_logs').insert({
        phone_id: params.id,
        api_source: 'mobile-api.dev',
        status: 'success',
        message: `Fetched ${newSpecs.length} specifications`,
        imported_by: user?.id,
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch specifications from API');

      const user = await getCurrentUser();
      await supabase.from('api_import_logs').insert({
        phone_id: params.id,
        api_source: 'mobile-api.dev',
        status: 'error',
        message: err.message,
        imported_by: user?.id,
      });
    }

    setLoading(false);
  }

  function updateSpec(index, field, value) {
    setSpecs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeSpec(index) {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  }

  function addNewSpec() {
    setSpecs(prev => [...prev, {
      category: '',
      spec_key: '',
      spec_value: '',
      source: 'manual',
      display_order: prev.length,
    }]);
  }

  async function saveSpecs() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await supabase
        .from('specifications')
        .delete()
        .eq('phone_id', params.id);

      const specsToInsert = specs.map(spec => ({
        ...spec,
        phone_id: params.id,
      }));

      const { error: insertError } = await supabase
        .from('specifications')
        .insert(specsToInsert);

      if (insertError) throw insertError;

      setSuccess('Specifications saved successfully!');
      setTimeout(() => {
        router.push('/admin/phones');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to save specifications');
    }

    setLoading(false);
  }

  if (loadingData) {
    return <div>Loading...</div>;
  }

  if (!phone) {
    return <div>Phone not found</div>;
  }

  const groupedSpecs = specs.reduce((acc, spec) => {
    if (!acc[spec.category]) acc[spec.category] = [];
    acc[spec.category].push(spec);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/phones">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Phone Specifications</h1>
          <p className="text-gray-600 mt-1">{phone.brands.name} {phone.model_name}</p>
        </div>
        <Button onClick={fetchFromAPI} disabled={loading} className="gap-2">
          <Download className="h-4 w-4" />
          Fetch from API
        </Button>
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

      {specs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No specifications yet. Fetch from API or add manually.</p>
            <Button onClick={addNewSpec} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Specification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(groupedSpecs).map(([category, categorySpecs]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categorySpecs.map((spec, idx) => {
                    const globalIndex = specs.indexOf(spec);
                    return (
                      <div key={globalIndex} className="grid grid-cols-12 gap-3 items-start">
                        <div className="col-span-3">
                          <Input
                            value={spec.spec_key}
                            onChange={(e) => updateSpec(globalIndex, 'spec_key', e.target.value)}
                            placeholder="Key"
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            value={spec.spec_value}
                            onChange={(e) => updateSpec(globalIndex, 'spec_value', e.target.value)}
                            placeholder="Value"
                          />
                        </div>
                        <div className="col-span-2">
                          <Badge variant={spec.source === 'api' ? 'default' : 'secondary'}>
                            {spec.source}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpec(globalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveSpecs} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save All Specifications'}
            </Button>
            <Button onClick={addNewSpec} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Spec
            </Button>
            <Link href="/admin/phones">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
