'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, profile, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user && profile) {
        switch (profile.role) {
          case 'student':
            redirect('/student/dashboard');
            break;
          case 'instructor':
            redirect('/instructor/dashboard');
            break;
          case 'admin':
            redirect('/admin/dashboard');
            break;
          default:
            // Fallback for unknown roles
            redirect('/login');
            break;
        }
      } else {
        // If loading is finished and there's no user or profile, go to login
        redirect('/login');
      }
    }
  }, [user, profile, isUserLoading]);

  // You can show a global loading spinner here while checking auth state
  return <div>Loading...</div>;
}
