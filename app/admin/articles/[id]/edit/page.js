'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Eye, X, Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'blog',
    excerpt: '',
    content: '',
    featured_image_url: '',
    tags: [],
    is_published: false,
    meta_title: '',
    meta_description: '',
  });

  useEffect(() => {
    if (!isNew && params.id && params.id !== 'new') {
      loadArticle();
    } else {
      setLoadingData(false);
    }
  }, [params.id, isNew]);

  async function loadArticle() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (error || !data) {
      router.push('/admin/articles');
      return;
    }

    setFormData({
      title: data.title || '',
      slug: data.slug || '',
      type: data.type || 'blog',
      excerpt: data.excerpt || '',
      content: data.content || '',
      featured_image_url: data.featured_image_url || '',
      tags: data.tags || [],
      is_published: data.is_published || false,
      meta_title: data.meta_title || '',
      meta_description: data.meta_description || '',
    });

    setLoadingData(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'title' && (isNew || !formData.slug)) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }

  function handleSelectChange(value) {
    setFormData(prev => ({ ...prev, type: value }));
  }

  function handleSwitchChange(checked) {
    setFormData(prev => ({ ...prev, is_published: checked }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  }

  function removeTag(tagToRemove) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.title || !formData.slug || !formData.type) {
      setError('Title, slug, and type are required');
      setLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();
      
      const dataToSubmit = {
        title: formData.title,
        slug: formData.slug,
        type: formData.type,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        featured_image_url: formData.featured_image_url || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        is_published: formData.is_published,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      if (isNew) {
        dataToSubmit.author_id = user?.id;
        const { data, error: insertError } = await supabase
          .from('articles')
          .insert(dataToSubmit)
          .select()
          .single();

        if (insertError) throw insertError;

        setSuccess('Article created successfully!');
        setTimeout(() => {
          router.push(`/admin/articles/${data.id}/edit`);
        }, 1000);
      } else {
        const { error: updateError } = await supabase
          .from('articles')
          .update(dataToSubmit)
          .eq('id', params.id);

        if (updateError) throw updateError;

        setSuccess('Article updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save article');
    }

    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this article?')) return;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', params.id);

    if (!error) {
      router.push('/admin/articles');
    }
  }

  function renderMarkdownPreview() {
    const content = formData.content;
    if (!content) return <p className="text-gray-500">No content to preview</p>;

    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-2xl font-bold mt-5 mb-3">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={i} className="ml-6 list-disc">{line.slice(2)}</li>);
      } else if (line.match(/^\d+\. /)) {
        elements.push(<li key={i} className="ml-6 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-gray-300 pl-4 italic my-4">
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.startsWith('```')) {
        let codeBlock = '';
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeBlock += lines[i] + '\n';
          i++;
        }
        elements.push(
          <pre key={i} className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
            <code>{codeBlock}</code>
          </pre>
        );
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        let parsedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');
        
        elements.push(
          <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: parsedLine }} />
        );
      }
      i++;
    }

    return elements;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {isNew ? 'New Article' : 'Edit Article'}
          </h1>
          {!isNew && formData.title && (
            <p className="text-gray-600 mt-1">{formData.title}</p>
          )}
        </div>
        {!isNew && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        )}
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

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="seo">SEO & Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter article title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={handleSelectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="article-url-slug"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured_image_url">Featured Image URL</Label>
                    <Input
                      id="featured_image_url"
                      name="featured_image_url"
                      value={formData.featured_image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {formData.featured_image_url && (
                  <div className="flex items-start gap-4">
                    <div className="w-48 h-32 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={formData.featured_image_url}
                        alt="Featured"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, featured_image_url: '' }))}
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    placeholder="Brief summary of the article..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content (Markdown)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your article content in Markdown...

# Heading 1
## Heading 2

Regular paragraph with **bold** and *italic* text.

- Bullet point
- Another bullet

1. Numbered list
2. Second item

> Blockquote

`inline code`

```
code block
```

[Link text](https://example.com)"
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.featured_image_url && (
                  <div className="w-full h-64 relative rounded-lg overflow-hidden bg-gray-100 mb-6">
                    <Image
                      src={formData.featured_image_url}
                      alt="Featured"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <h1 className="text-4xl font-bold mb-4">{formData.title || 'Untitled'}</h1>
                {formData.excerpt && (
                  <p className="text-lg text-gray-600 mb-6">{formData.excerpt}</p>
                )}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <hr className="my-6" />
                <div className="prose max-w-none">
                  {renderMarkdownPreview()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    placeholder="SEO title (defaults to article title)"
                  />
                  <p className="text-sm text-gray-500">
                    {(formData.meta_title || formData.title).length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    placeholder="SEO description (defaults to excerpt)"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    {(formData.meta_description || formData.excerpt).length}/160 characters
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    Published
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : isNew ? 'Create Article' : 'Save Changes'}
          </Button>
          <Link href="/admin/articles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
