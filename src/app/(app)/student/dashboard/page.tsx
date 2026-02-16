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
import { courses, assignments, recentFeedback } from '@/lib/data';
import { ArrowRight, CalendarClock, MessageSquare, PlayCircle } from 'lucide-react';
import { useUser } from '@/firebase';

export default function StudentDashboard() {
  const { profile } = useUser();
  const continueLearningCourse = courses[1];

  const firstName = profile?.firstName || 'Student';

  return (
    <div className="container mx-auto">
      <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">
        Welcome back, {firstName}!
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Continue Learning */}
        <Card className="lg:col-span-2 xl:col-span-2 shadow-lg transition-transform hover:scale-[1.02] duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <PlayCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Continue Learning</span>
            </div>
            <CardTitle className="font-headline text-2xl pt-2">{continueLearningCourse.title}</CardTitle>
            <CardDescription>{continueLearningCourse.instructor}</CardDescription>
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
                <Progress value={continueLearningCourse.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{continueLearningCourse.progress}% complete</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="#">
                Jump Back In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
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
            <ul className="space-y-4">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
                    <span className="text-sm font-bold">{new Date(assignment.dueDate).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{new Date(assignment.dueDate).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.course}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <CardTitle className="font-headline text-lg">Recent Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentFeedback.map((feedback) => (
                <li key={feedback.id} className="border-l-4 border-primary pl-4 py-1">
                    <p className="font-semibold">{feedback.assignmentTitle}</p>
                    <p className="text-sm text-muted-foreground italic">"{feedback.feedbackSummary}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{feedback.date}</p>
                </li>
              ))}
            </ul>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
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
                <CardDescription className="text-sm mb-2">{course.instructor}</CardDescription>
                <Progress value={course.progress} className="w-full mb-1" />
                <p className="text-xs text-muted-foreground">{course.progress}% complete</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full">Go to Course</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
