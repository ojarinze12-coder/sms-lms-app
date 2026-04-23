'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = '/school/dashboard', label = 'Back to Dashboard' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}