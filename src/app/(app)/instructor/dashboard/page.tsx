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
import { Badge } from '@/components/ui/badge';
import { courses } from '@/lib/data';
import { ArrowRight, PlusCircle, Users, ClipboardCheck } from 'lucide-react';

export default function InstructorDashboard() {
  const instructorCourses = courses.filter(c => c.instructor === 'Dr. Emily Carter');

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
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/instructor/course/new/edit">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Course
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">My Courses</CardTitle>
            <CardDescription>Manage your course content and view student progress.</CardDescription>
          </CardHeader>
          <CardContent>
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
                        <span>34 students</span>
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
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Recent Submissions</CardTitle>
            <CardDescription>Review the latest work from your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
                <li className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Alex Johnson</p>
                        <p className="text-sm text-muted-foreground">Submitted "Data Analysis Project Proposal" for Data Science 101</p>
                    </div>
                    <Button variant="outline">Grade Now</Button>
                </li>
                <li className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Jane Doe</p>
                        <p className="text-sm text-muted-foreground">Submitted "Final Project" for Web Development Bootcamp</p>
                    </div>
                    <Button variant="outline">Grade Now</Button>
                </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
