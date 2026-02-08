import Link from 'next/link';
import { GraduationCap, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, UserRole } from '@/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: Record<UserRole, NavLink[]> = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard' },
    { href: '/student/writing-center', label: 'Writing Center' },
  ],
  instructor: [
    { href: '/instructor/dashboard', label: 'Dashboard' },
    { href: '/instructor/rubric-generator', label: 'Rubric Generator' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard' },
  ],
};

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

export default function Header({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Link href={`/${user.role}/dashboard`} className="flex items-center gap-2 font-semibold">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="font-headline text-lg">VersoraAI</span>
      </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {(navLinks[user.role] || []).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={userAvatar?.imageUrl} alt={user.name} data-ai-hint={userAvatar?.imageHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
