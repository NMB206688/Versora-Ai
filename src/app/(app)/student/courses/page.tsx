'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookCopy } from 'lucide-react';
import { enrollInCourse } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/lib/definitions';

function EnrollButton({ courseId }: { courseId: string }) {
  const { user, profile } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    if (!user || !profile) {
      toast({ title: 'Error', description: 'You must be logged in to enroll.', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      const studentName = `${profile.firstName} ${profile.lastName}`.trim();
      const result = await enrollInCourse(courseId, user.uid, studentName);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Button onClick={handleEnroll} disabled={isPending} className="w-full">
      {isPending ? 'Enrolling...' : 'Enroll Now'}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function CoursesPage() {
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), where('published', '==', true));
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-muted-foreground">Browse and enroll in available courses.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden shadow-lg">
              <Skeleton className="w-full h-48" />
              <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
              <CardContent><Skeleton className="h-12 w-full" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden shadow-lg flex flex-col">
              <div className="relative w-full h-48">
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={course.imageHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-headline text-xl">{course.title}</CardTitle>
                <CardDescription>By {course.instructorName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
              </CardContent>
              <CardFooter>
                <EnrollButton courseId={course.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg py-20">
          <BookCopy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-headline text-xl">No Courses Available</h3>
          <p className="mt-2">There are currently no published courses available for enrollment. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
