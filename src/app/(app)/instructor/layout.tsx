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
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    // You can show a loading spinner here
    return <div>Loading...</div>;
  }

  // A mock user for display purposes until we fetch roles from Firestore
  const displayUser = {
      id: user.uid,
      name: user.displayName || user.email || 'Instructor',
      email: user.email || '',
      role: 'instructor', // This will be dynamic later
      avatarUrl: user.photoURL || ''
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
