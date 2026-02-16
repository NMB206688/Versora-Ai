'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // This is a placeholder. We will implement role-based redirection soon.
        redirect('/student/dashboard');
      } else {
        redirect('/login');
      }
    }
  }, [user, isUserLoading]);

  // You can show a global loading spinner here while checking auth state
  return <div>Loading...</div>;
}
