'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Smartphone, Tag, FileText, DollarSign, Plus, Download, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPhones: 0,
    publishedPhones: 0,
    totalBrands: 0,
    totalArticles: 0,
    priceChangesThisMonth: 0,
  });
  const [recentPhones, setRecentPhones] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentImports, setRecentImports] = useState([]);
  const [recentPriceUpdates, setRecentPriceUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const [
        phonesCount,
        publishedPhonesCount,
        brandsCount,
        articlesCount,
        priceChanges,
        phones,
        articles,
        imports,
        priceUpdates
      ] = await Promise.all([
        supabase.from('phones').select('*', { count: 'exact', head: true }),
        supabase.from('phones').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('price_history')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('phones')
          .select('id, model_name, created_at, is_published, brands(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('articles')
          .select('id, title, type, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('api_import_logs')
          .select('id, status, message, created_at, phones(model_name, brands(name))')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(res => res)
          .catch(() => ({ data: [], error: null })),
        supabase.from('price_history')
          .select('id, currency, old_amount, new_amount, created_at, phones(model_name, brands(name))')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(res => res)
          .catch(() => ({ data: [], error: null })),
      ]).catch(() => [
        { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 },
        { data: [] }, { data: [] }, { data: [], error: null }, { data: [], error: null }
      ]);

      setStats({
        totalPhones: phonesCount.count || 0,
        publishedPhones: publishedPhonesCount.count || 0,
        totalBrands: brandsCount.count || 0,
        totalArticles: articlesCount.count || 0,
        priceChangesThisMonth: priceChanges.count || 0,
      });

      setRecentPhones(phones.data || []);
      setRecentArticles(articles.data || []);
      setRecentImports(imports.data || []);
      setRecentPriceUpdates(priceUpdates.data || []);
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to PinoyMobile Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.publishedPhones}</div>
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
            <CardTitle className="text-sm font-medium text-gray-600">Price Changes</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.priceChangesThisMonth}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/phones/new">
              <Button className="w-full justify-start gap-2">
                <Smartphone className="h-4 w-4" />
                Add New Phone
              </Button>
            </Link>
            <Link href="/admin/brands/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Tag className="h-4 w-4" />
                Add New Brand
              </Button>
            </Link>
            <Link href="/admin/articles/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Add Blog/News
              </Button>
            </Link>
            <Link href="/admin/comparisons/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                Create Comparison
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Recent Phones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPhones.length === 0 ? (
              <p className="text-sm text-gray-500">No phones added yet</p>
            ) : (
              <div className="space-y-3">
                {recentPhones.map((phone) => (
                  <Link key={phone.id} href={`/admin/phones/${phone.id}/specs`} className="block">
                    <div className="text-sm hover:bg-gray-50 rounded p-2 -m-2 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{phone.model_name}</p>
                        <Badge variant={phone.is_published ? 'default' : 'secondary'} className="text-xs">
                          {phone.is_published ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-xs">{phone.brands?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Recent Spec Imports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentImports.length === 0 ? (
              <p className="text-sm text-gray-500">No specs imported yet</p>
            ) : (
              <div className="space-y-3">
                {recentImports.map((log) => (
                  <div key={log.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {log.phones ? log.phones.model_name : 'Unknown'}
                      </p>
                      <Badge 
                        variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {log.phones?.brands?.name} • {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Recent Price Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPriceUpdates.length === 0 ? (
              <p className="text-sm text-gray-500">No price updates yet</p>
            ) : (
              <div className="space-y-3">
                {recentPriceUpdates.map((update) => (
                  <div key={update.id} className="text-sm">
                    <p className="font-medium truncate">
                      {update.phones ? `${update.phones.brands?.name} ${update.phones.model_name}` : 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      {update.old_amount && (
                        <span className="text-gray-400 line-through">
                          {update.currency} {Number(update.old_amount).toLocaleString()}
                        </span>
                      )}
                      <span className="text-green-600 font-medium">
                        {update.currency} {Number(update.new_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Latest Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <p className="text-sm text-gray-500">No articles added yet</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <Link key={article.id} href={`/admin/articles/${article.id}/edit`} className="block">
                    <div className="text-sm hover:bg-gray-50 rounded p-2 -m-2 transition-colors">
                      <p className="font-medium">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{article.type}</Badge>
                        <span className="text-gray-400 text-xs">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium mb-2">Workflow:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Add a new brand (if not exists)</li>
                <li>Add a new phone with basic info</li>
                <li>Click "Fetch Specs" to import from API</li>
                <li>Review and edit specifications</li>
                <li>Add pricing information</li>
                <li>Publish the phone</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
