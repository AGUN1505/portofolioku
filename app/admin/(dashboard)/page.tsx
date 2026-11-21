// app/admin/(dashboard)/page.tsx
// Dashboard Hub Page (Protected Server Component with Cache Components Suspense boundary)

import { Suspense } from 'react';
import { DashboardContent } from '../components/DashboardContent';
import AdminLoading from './loading';

export const instant = false;

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
