import Header from '@/components/layout/header';
import { users } from '@/lib/data';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = users.find(user => user.role === 'admin');

  if (!adminUser) {
    // Or redirect to login
    return <div>User not found</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={adminUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/20">
        {children}
      </main>
    </div>
  );
}
