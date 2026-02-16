'use client';

import Header from '@/components/layout/header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'instructor') {
        // If logged in but not an instructor, redirect to their correct dashboard
        router.push(`/${profile.role}/dashboard`);
      }
    }
  }, [user, profile, isUserLoading, router]);

  // Show a loading state while we verify the user and their role
  if (isUserLoading || !profile) {
    return <div>Loading...</div>;
  }

  // Construct the user object for the header
  const displayUser = {
      id: user.uid,
      name: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : user.email,
      email: user.email || '',
      role: profile.role, // Use the real role from the profile
      avatarUrl: profile.avatarUrl || user.photoURL || ''
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={displayUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
