'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Smartphone, Tag, FileText, DollarSign, Plus, Download } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPhones: 0,
    totalBrands: 0,
    totalArticles: 0,
    priceChangesThisMonth: 0,
  });
  const [recentPhones, setRecentPhones] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const [phonesCount, brandsCount, articlesCount, priceChanges, phones, articles] = await Promise.all([
        supabase.from('phones').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('price_history')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('phones')
          .select('id, model_name, created_at, brands(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('articles')
          .select('id, title, type, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        totalPhones: phonesCount.count || 0,
        totalBrands: brandsCount.count || 0,
        totalArticles: articlesCount.count || 0,
        priceChangesThisMonth: priceChanges.count || 0,
      });

      setRecentPhones(phones.data || []);
      setRecentArticles(articles.data || []);
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to PinoyMobile Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Phones</CardTitle>
            <Smartphone className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPhones}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Brands</CardTitle>
            <Tag className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Articles</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Price Changes (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.priceChangesThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/phones/new">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add New Phone
              </Button>
            </Link>
            <Link href="/admin/brands/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add New Brand
              </Button>
            </Link>
            <Link href="/admin/articles/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add Blog/News
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Phones</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPhones.length === 0 ? (
              <p className="text-sm text-gray-500">No phones added yet</p>
            ) : (
              <div className="space-y-3">
                {recentPhones.map((phone) => (
                  <div key={phone.id} className="text-sm">
                    <p className="font-medium">{phone.model_name}</p>
                    <p className="text-gray-500">{phone.brands?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <p className="text-sm text-gray-500">No articles added yet</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <div key={article.id} className="text-sm">
                    <p className="font-medium">{article.title}</p>
                    <p className="text-gray-500 capitalize">{article.type}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
