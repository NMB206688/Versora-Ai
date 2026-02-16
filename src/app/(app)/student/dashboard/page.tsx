'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CalendarClock, MessageSquare, PlayCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Course, Enrollment, Assignment, Submission } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user, profile } = useUser();
  const firestore = useFirestore();

  // 1. Fetch enrollments for the current student
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [user, firestore]);

  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  // 2. Extract course IDs from enrollments
  const enrolledCourseIds = useMemo(() => {
    if (!enrollments) return [];
    return enrollments.map(e => e.courseId);
  }, [enrollments]);

  // 3. Fetch course details for the enrolled courses
  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || enrolledCourseIds.length === 0) return null;
    // Note: 'in' queries are limited to 30 items. For more, you'd need multiple queries.
    return query(collection(firestore, 'courses'), where(documentId(), 'in', enrolledCourseIds));
  }, [firestore, enrolledCourseIds]);

  const { data: studentCourses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);

  // 4. Get upcoming assignments across all enrolled courses
  const upcomingAssignmentsQuery = useMemoFirebase(() => {
    if (!firestore || enrolledCourseIds.length === 0) return null;
    return query(
      collectionGroup(firestore, 'assignments'),
      where('courseId', 'in', enrolledCourseIds),
      where('deadline', '>', new Date().toISOString()),
      orderBy('deadline', 'asc'),
      limit(5)
    );
  }, [firestore, enrolledCourseIds]);

  const { data: upcomingAssignments, isLoading: isLoadingAssignments } = useCollection<Assignment>(upcomingAssignmentsQuery);

  // 5. Get recent submissions by the current user
  const recentSubmissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collectionGroup(firestore, 'submissions'),
        where('studentId', '==', user.uid),
        orderBy('submissionDate', 'desc'),
        limit(3)
    );
  }, [firestore, user]);

  const { data: recentSubmissions, isLoading: isLoadingSubmissions } = useCollection<Submission>(recentSubmissionsQuery);
  
  const isLoading = isLoadingEnrollments || isLoadingCourses || isLoadingAssignments || isLoadingSubmissions;
  const continueLearningCourse = studentCourses?.[0]; // Use the first enrolled course
  const firstName = profile?.firstName || 'Student';

  return (
    <div className="container mx-auto">
      <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">
        Welcome back, {firstName}!
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Continue Learning */}
        <Card className="lg:col-span-2 xl:col-span-2 shadow-lg transition-transform hover:scale-[1.02] duration-300">
           {isLoading && !continueLearningCourse && (
            <>
                <CardHeader><Skeleton className="h-5 w-32" /><Skeleton className="h-8 w-3/4 mt-2" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
                <CardContent><Skeleton className="w-full h-40 rounded-lg" /><div className="space-y-2 mt-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </>
           )}
          {!isLoading && continueLearningCourse && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <PlayCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Continue Learning</span>
                </div>
                <CardTitle className="font-headline text-2xl pt-2">{continueLearningCourse.title}</CardTitle>
                <CardDescription>{continueLearningCourse.instructorName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={continueLearningCourse.imageUrl}
                    alt={continueLearningCourse.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={continueLearningCourse.imageHint}
                  />
                </div>
                <div className="space-y-2">
                    {/* Progress is hardcoded for now */}
                    <Progress value={30} className="w-full" />
                    <p className="text-sm text-muted-foreground">30% complete</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href={`/student/course/${continueLearningCourse.id}`}>
                    Jump Back In <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </>
          )}
           {!isLoading && !continueLearningCourse && (
             <CardContent className="flex flex-col items-center justify-center h-full text-center py-12">
                 <h3 className="font-headline text-xl">Ready to Learn?</h3>
                 <p className="text-muted-foreground mt-2">You are not enrolled in any courses yet.</p>
                 <Button className="mt-4">Browse Courses</Button>
             </CardContent>
           )}
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-5 w-5" />
                <CardTitle className="font-headline text-lg">Upcoming Deadlines</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : upcomingAssignments && upcomingAssignments.length > 0 ? (
                <ul className="space-y-4">
                    {upcomingAssignments.map(assignment => (
                    <li key={assignment.id}>
                        <Link href={`/student/course/${assignment.courseId}/module/${assignment.moduleId}/assignment/${assignment.id}`} className="block hover:bg-muted p-2 rounded-md">
                        <p className="font-semibold hover:underline">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {format(new Date(assignment.deadline), 'PP')}</p>
                        </Link>
                    </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full min-h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
                    <p>No upcoming deadlines. You're all caught up!</p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <CardTitle className="font-headline text-lg">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : recentSubmissions && recentSubmissions.length > 0 ? (
                 <ul className="space-y-2">
                    {recentSubmissions.map(submission => (
                    <li key={submission.id}>
                        <Link href={`/student/course/${submission.courseId}/module/${submission.moduleId}/assignment/${submission.assignmentId}`} className="block hover:bg-muted p-2 rounded-md">
                        <p className="font-semibold truncate">
                            {submission.grade !== undefined 
                            ? <span className="font-bold text-green-600">Graded: </span> 
                            : <span className="font-bold text-primary">Submitted: </span>
                            }
                            {submission.assignmentTitle}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {submission.grade !== undefined 
                            ? `Grade: ${submission.grade}`
                            : `On ${format(new Date(submission.submissionDate), 'PP')}`
                            }
                        </p>
                        </Link>
                    </li>
                    ))}
                </ul>
            ) : (
                <div className="flex h-full min-h-[150px] items-center justify-center text-center text-sm text-muted-foreground">
                    <p>Your recent submissions and grades will appear here.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Courses */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-2xl font-bold">My Courses</h2>
            <Button variant="outline" asChild>
                <Link href="#">View All</Link>
            </Button>
        </div>
        
        {isLoading && (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-40" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                       <Skeleton className="h-4 w-full pt-2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
        )}

        {!isLoading && studentCourses && studentCourses.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {studentCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300">
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
                    <CardTitle className="font-headline text-lg mb-1">{course.title}</CardTitle>
                    <CardDescription className="text-sm mb-2">{course.instructorName}</CardDescription>
                    {/* Progress is hardcoded for now */}
                    <Progress value={30} className="w-full mb-1" />
                    <p className="text-xs text-muted-foreground">30% complete</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/student/course/${course.id}`}>Go to Course</Link>
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        )}

        {!isLoading && (!studentCourses || studentCourses.length === 0) && (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg py-12">
                <h3 className="font-headline text-xl">No Courses Yet</h3>
                <p className="mt-2">You are not enrolled in any courses. Browse the course catalog to get started.</p>
                <Button className="mt-4">Browse Courses</Button>
            </div>
        )}

      </div>
    </div>
  );
}

    