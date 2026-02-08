import Header from '@/components/layout/header';
import { users } from '@/lib/data';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const studentUser = users.find(user => user.role === 'student');

  if (!studentUser) {
    // Or redirect to login
    return <div>User not found</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={studentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
