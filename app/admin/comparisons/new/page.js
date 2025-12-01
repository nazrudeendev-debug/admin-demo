'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewComparisonPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/comparisons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Comparison</h1>
          <p className="text-gray-600 mt-1">Compare multiple phones side by side</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Tool</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Comparison builder coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
