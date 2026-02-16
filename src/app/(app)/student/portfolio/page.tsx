'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { PortfolioItem } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const portfolioItemsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/portfolio/main/items`), orderBy('addedDate', 'desc'));
  }, [firestore, user]);

  const { data: portfolioItems, isLoading } = useCollection<PortfolioItem>(portfolioItemsQuery);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Learning Portfolio
        </h1>
        <p className="text-muted-foreground">A curated collection of your best work.</p>
      </div>
      
      {isLoading ? (
         <div className="grid gap-8 md:grid-cols-2">
            <Card><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /><Skeleton className="h-4 w-20 mt-4" /><Skeleton className="h-12 w-full mt-1" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
            <Card><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /><Skeleton className="h-4 w-20 mt-4" /><Skeleton className="h-12 w-full mt-1" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
         </div>
      ) : portfolioItems && portfolioItems.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{item.assignmentTitle}</CardTitle>
                <CardDescription>From: {item.courseTitle} | Grade: <span className="font-bold text-primary">{item.grade}%</span></CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground italic mb-4">
                  <p>&quot;{item.submissionExcerpt}&quot;</p>
                </div>
                <h4 className="font-semibold text-sm mb-1">My Reflection</h4>
                <p className="text-sm text-muted-foreground">{item.reflection}</p>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" className="w-full">View Full Submission</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg py-20">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-headline text-xl">Your Portfolio is Empty</h3>
          <p className="mt-2 mb-4">Add your best graded assignments to build a showcase of your learning journey.</p>
          <Button asChild>
            <Link href="/student/dashboard">Find an Assignment to Add</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
