// app/auth/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0f4f8]" />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}