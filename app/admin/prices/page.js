'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, History } from 'lucide-react';

export default function PricesPage() {
  const [phones, setPhones] = useState([]);
  const [prices, setPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    region: 'Philippines',
    currency: 'PHP',
    amount: '',
    promo_note: '',
  });

  useEffect(() => {
    loadPhones();
    loadPrices();
    loadPriceHistory();
  }, []);

  async function loadPhones() {
    const { data } = await supabase
      .from('phones')
      .select('id, model_name, brands(name)')
      .order('model_name');
    if (data) setPhones(data);
  }

  async function loadPrices() {
    const { data } = await supabase
      .from('prices')
      .select(`
        *,
        phones (
          model_name,
          brands (name)
        )
      `)
      .eq('is_current', true)
      .order('created_at', { ascending: false });
    if (data) setPrices(data);
  }

  async function loadPriceHistory() {
    const { data } = await supabase
      .from('price_history')
      .select(`
        *,
        phones (
          model_name,
          brands (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPriceHistory(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPhone) return;

    setLoading(true);
    setSuccess('');

    const { error } = await supabase.from('prices').insert({
      phone_id: selectedPhone,
      ...formData,
      amount: parseFloat(formData.amount),
    });

    if (!error) {
      setSuccess('Price added successfully!');
      setFormData({ region: 'Philippines', currency: 'PHP', amount: '', promo_note: '' });
      setSelectedPhone('');
      loadPrices();
      loadPriceHistory();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
        <p className="text-gray-600 mt-1">Manage phone prices and view history</p>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Add Price
          </TabsTrigger>
          <TabsTrigger value="current" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Current Prices
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Price History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Price</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Select Phone</Label>
                  <Select value={selectedPhone} onValueChange={setSelectedPhone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a phone" />
                    </SelectTrigger>
                    <SelectContent>
                      {phones.map((phone) => (
                        <SelectItem key={phone.id} value={phone.id}>
                          {phone.brands.name} {phone.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHP">PHP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo_note">Promo Note (Optional)</Label>
                  <Input
                    id="promo_note"
                    value={formData.promo_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, promo_note: e.target.value }))}
                    placeholder="Special offer, discount, etc."
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Price'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
            </CardHeader>
            <CardContent>
              {prices.length === 0 ? (
                <p className="text-gray-500">No prices set yet.</p>
              ) : (
                <div className="space-y-3">
                  {prices.map((price) => (
                    <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {price.phones.brands.name} {price.phones.model_name}
                        </p>
                        <p className="text-sm text-gray-500">{price.region}</p>
                        {price.promo_note && (
                          <Badge variant="secondary" className="mt-1">{price.promo_note}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{price.currency} {Number(price.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Price Change History</CardTitle>
            </CardHeader>
            <CardContent>
              {priceHistory.length === 0 ? (
                <p className="text-gray-500">No price changes yet.</p>
              ) : (
                <div className="space-y-3">
                  {priceHistory.map((history) => (
                    <div key={history.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {history.phones.brands.name} {history.phones.model_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(history.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {history.old_amount && (
                            <p className="text-sm text-gray-500 line-through">
                              {history.currency} {Number(history.old_amount).toLocaleString()}
                            </p>
                          )}
                          <p className="font-bold">
                            {history.currency} {Number(history.new_amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
