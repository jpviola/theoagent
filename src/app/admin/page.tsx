'use client';

import AdminDashboard from '@/components/AdminDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredSubscriptionTier="expert" requireEmailVerified>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
