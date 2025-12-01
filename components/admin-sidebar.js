'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  Smartphone,
  FileText,
  DollarSign,
  GitCompare,
  Image,
  FileCode,
  Users,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/brands', label: 'Brands', icon: Tag },
  { href: '/admin/phones', label: 'Phones', icon: Smartphone },
  { href: '/admin/prices', label: 'Prices', icon: DollarSign },
  { href: '/admin/comparisons', label: 'Comparisons', icon: GitCompare },
  { href: '/admin/articles', label: 'Blogs & News', icon: FileText },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/api-logs', label: 'API Logs', icon: FileCode },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">PinoyMobile</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
