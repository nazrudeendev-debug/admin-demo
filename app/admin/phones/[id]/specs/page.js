'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Download, Save, Trash2, Plus, Check, CheckCheck, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PhoneSpecsPage() {
  const router = useRouter();
  const params = useParams();
  const [phone, setPhone] = useState(null);
  const [specs, setSpecs] = useState([]);
  const [currentDbSpecs, setCurrentDbSpecs] = useState([]);
  const [apiSpecs, setApiSpecs] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [showDiffModal, setShowDiffModal] = useState(false);
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
    if (specsData) {
      setSpecs(specsData);
      setCurrentDbSpecs(specsData);
    }
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

      setApiSpecs(newSpecs);
      const initialSelection = {};
      newSpecs.forEach((_, idx) => {
        initialSelection[idx] = true;
      });
      setSelectedSpecs(initialSelection);
      setShowDiffModal(true);

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

  function toggleSpecSelection(index) {
    setSelectedSpecs(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function selectAll() {
    const newSelection = {};
    apiSpecs.forEach((_, idx) => {
      newSelection[idx] = true;
    });
    setSelectedSpecs(newSelection);
  }

  function deselectAll() {
    setSelectedSpecs({});
  }

  function acceptSelected() {
    const selected = apiSpecs.filter((_, idx) => selectedSpecs[idx]);
    setSpecs(selected.map((spec, idx) => ({ ...spec, display_order: idx })));
    setShowDiffModal(false);
    setSuccess(`Applied ${selected.length} specifications. Review below and save.`);
  }

  function acceptAll() {
    setSpecs(apiSpecs.map((spec, idx) => ({ ...spec, display_order: idx })));
    setShowDiffModal(false);
    setSuccess(`Applied all ${apiSpecs.length} specifications. Review below and save.`);
  }

  function updateSpec(index, field, value) {
    setSpecs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, source: 'manual' };
      return updated;
    });
  }

  function removeSpec(index) {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  }

  function addNewSpec(category = '') {
    setSpecs(prev => [...prev, {
      category: category,
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

      if (specs.length > 0) {
        const specsToInsert = specs.map((spec, idx) => ({
          phone_id: params.id,
          category: spec.category || 'General',
          spec_key: spec.spec_key,
          spec_value: spec.spec_value,
          source: spec.source,
          display_order: idx,
        }));

        const { error: insertError } = await supabase
          .from('specifications')
          .insert(specsToInsert);

        if (insertError) throw insertError;
      }

      setSuccess('Specifications saved successfully!');
      setCurrentDbSpecs(specs);

    } catch (err) {
      setError(err.message || 'Failed to save specifications');
    }

    setLoading(false);
  }

  function findDbSpec(apiSpec) {
    return currentDbSpecs.find(
      db => db.category === apiSpec.category && db.spec_key === apiSpec.spec_key
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!phone) {
    return <div>Phone not found</div>;
  }

  const groupedSpecs = specs.reduce((acc, spec) => {
    const cat = spec.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(spec);
    return acc;
  }, {});

  const groupedApiSpecs = apiSpecs.reduce((acc, spec, idx) => {
    const cat = spec.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...spec, originalIndex: idx });
    return acc;
  }, {});

  const selectedCount = Object.values(selectedSpecs).filter(Boolean).length;

  return (
    <div className="max-w-6xl space-y-6">
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
          {loading ? 'Fetching...' : 'Fetch from API'}
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

      <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Compare API Specs with Current Database</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between py-2 border-b">
            <div className="text-sm text-gray-600">
              {selectedCount} of {apiSpecs.length} specifications selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                <X className="h-4 w-4 mr-1" />
                Deselect All
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-gray-100 sticky top-0 font-medium text-sm">
              <div className="col-span-1"></div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Key</div>
              <div className="col-span-3">API Value</div>
              <div className="col-span-1 text-center"></div>
              <div className="col-span-3">Current DB Value</div>
            </div>
            
            {Object.entries(groupedApiSpecs).map(([category, categorySpecs]) => (
              <div key={category} className="border-b last:border-b-0">
                <div className="bg-gray-50 px-2 py-1 font-medium text-sm text-gray-700">
                  {category}
                </div>
                {categorySpecs.map((spec) => {
                  const dbSpec = findDbSpec(spec);
                  const isDifferent = !dbSpec || dbSpec.spec_value !== spec.spec_value;
                  const isSelected = selectedSpecs[spec.originalIndex];
                  
                  return (
                    <div
                      key={spec.originalIndex}
                      className={`grid grid-cols-12 gap-2 py-2 px-2 items-center cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSpecSelection(spec.originalIndex)}
                    >
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">{spec.category}</div>
                      <div className="col-span-2 text-sm font-medium">{spec.spec_key}</div>
                      <div className={`col-span-3 text-sm ${isDifferent ? 'text-green-600 font-medium' : ''}`}>
                        {spec.spec_value}
                      </div>
                      <div className="col-span-1 text-center">
                        {isDifferent && <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />}
                      </div>
                      <div className={`col-span-3 text-sm ${isDifferent ? 'text-gray-400' : 'text-gray-600'}`}>
                        {dbSpec ? dbSpec.spec_value : <span className="italic">Not in DB</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowDiffModal(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={acceptSelected} disabled={selectedCount === 0}>
              <Check className="h-4 w-4 mr-1" />
              Accept Selected ({selectedCount})
            </Button>
            <Button onClick={acceptAll}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Accept All ({apiSpecs.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {specs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No specifications yet. Fetch from API or add manually.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchFromAPI} disabled={loading} className="gap-2">
                <Download className="h-4 w-4" />
                Fetch from API
              </Button>
              <Button onClick={() => addNewSpec('General')} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(groupedSpecs).map(([category, categorySpecs]) => (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{category}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addNewSpec(category)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categorySpecs.map((spec) => {
                    const globalIndex = specs.indexOf(spec);
                    return (
                      <div key={globalIndex} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-3">
                          <Input
                            value={spec.spec_key}
                            onChange={(e) => updateSpec(globalIndex, 'spec_key', e.target.value)}
                            placeholder="Key (e.g., Screen Size)"
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            value={spec.spec_value}
                            onChange={(e) => updateSpec(globalIndex, 'spec_value', e.target.value)}
                            placeholder="Value (e.g., 6.7 inches)"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Badge variant={spec.source === 'api' ? 'default' : 'secondary'}>
                            {spec.source}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpec(globalIndex)}
                            className="text-red-500 hover:text-red-700"
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

          <div className="flex items-center gap-3 sticky bottom-0 bg-white py-4 border-t">
            <Button onClick={saveSpecs} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save All Specifications'}
            </Button>
            <Button onClick={() => addNewSpec('')} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Spec
            </Button>
            <Link href="/admin/phones">
              <Button variant="outline">Back to Phones</Button>
            </Link>
            <span className="text-sm text-gray-500 ml-auto">
              {specs.length} specifications total
            </span>
          </div>
        </>
      )}
    </div>
  );
}
