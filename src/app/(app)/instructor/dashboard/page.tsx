'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useFormStatus } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, Users, ClipboardCheck, Eye } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { createCourse } from '@/lib/actions';
import type { Submission } from '@/lib/definitions';
import { format } from 'date-fns';

function CreateCourseButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
      <PlusCircle className="mr-2 h-4 w-4" />
      {pending ? 'Creating...' : 'Create New Course'}
    </Button>
  );
}

export default function InstructorDashboard() {
  const { user, profile } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'courses'), where('instructorId', '==', user.uid));
  }, [user, firestore]);

  const recentSubmissionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This query requires a composite index on (courseInstructorId, submissionDate)
    // Firestore will provide a link in the console error to create it automatically.
    return query(
      collectionGroup(firestore, 'submissions'),
      where('courseInstructorId', '==', user.uid),
      orderBy('submissionDate', 'desc'),
      limit(5)
    );
  }, [user, firestore]);

  const { data: instructorCourses, isLoading: isLoadingCourses } = useCollection(coursesQuery);
  const { data: recentSubmissions, isLoading: isLoadingSubmissions } = useCollection<Submission>(recentSubmissionsQuery);
  
  const [state, formAction] = useActionState(createCourse, undefined);

  const isLoading = isLoadingCourses || isLoadingSubmissions;

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Instructor Dashboard
        </h1>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href="/instructor/rubric-generator">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    AI Rubric Generator
                </Link>
            </Button>
            <form action={formAction}>
              {user && profile && (
                <>
                  <input type="hidden" name="instructorId" value={user.uid} />
                  <input type="hidden" name="instructorName" value={`${profile.firstName} ${profile.lastName}`.trim()} />
                </>
              )}
              <CreateCourseButton />
            </form>
        </div>
      </div>

      {state?.message && <p className="text-destructive mb-4">{state.message}</p>}

      <div className="grid gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">My Courses</CardTitle>
            <CardDescription>Manage your course content and view student progress.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCourses && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-40" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            {!isLoadingCourses && instructorCourses && instructorCourses.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {instructorCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-xl">
                    <CardHeader className="p-0">
                      <div className="relative w-full h-40">
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          data-ai-hint={course.imageHint}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="font-headline text-lg mb-2">{course.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4" />
                          <span>{Object.keys(course.studentMembers || {}).length} students</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full">
                        <Link href={`/instructor/course/${course.id}/edit`}>
                          Manage Course <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            {!isLoadingCourses && (!instructorCourses || instructorCourses.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                    <p>You haven't created any courses yet.</p>
                    <p className="mt-2 text-sm">Click the "Create New Course" button to get started.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Recent Submissions</CardTitle>
            <CardDescription>Review the latest work from your students.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoadingSubmissions ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
             ) : recentSubmissions && recentSubmissions.length > 0 ? (
                <ul className="space-y-4">
                  {recentSubmissions.map(submission => (
                    <li key={submission.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{submission.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted "{submission.assignmentTitle}" for {submission.courseTitle}
                            </p>
                        </div>
                        <Button asChild variant="outline">
                           <Link href={`/instructor/course/${submission.courseId}/module/${submission.moduleId}/assignment/${submission.assignmentId}/grade/${submission.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {submission.grade === undefined ? 'Grade Now' : 'View'}
                           </Link>
                        </Button>
                    </li>
                  ))}
                </ul>
             ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No recent submissions from your students.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
