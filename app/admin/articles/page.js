'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  }

  async function deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    await supabase.from('articles').delete().eq('id', id);
    loadArticles();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogs & News</h1>
          <p className="text-gray-600 mt-1">Manage articles and news posts</p>
        </div>
        <Link href="/admin/articles/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
        </Link>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No articles yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      <Badge variant={article.is_published ? 'default' : 'secondary'}>
                        {article.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{article.type}</Badge>
                    </div>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm">{article.excerpt}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => deleteArticle(article.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
