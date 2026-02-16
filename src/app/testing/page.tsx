'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, GraduationCap, Briefcase, KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TestingGuidePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl font-bold">Application UI Guide</h1>
          <p className="text-muted-foreground mt-2">
            Use these links and credentials to navigate and test the different user roles and features.
          </p>
        </div>
        
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <KeyRound className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Test Credentials</CardTitle>
            </div>
            <CardDescription>
              Use the signup page to create these users. You must create each account before you can sign in with it.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <Alert>
              <GraduationCap className="h-4 w-4" />
              <AlertTitle>Student</AlertTitle>
              <AlertDescription>
                <p><strong>Email:</strong> student@gmail.com</p>
                <p><strong>Password:</strong> Student@123</p>
              </AlertDescription>
            </Alert>
             <Alert>
              <Briefcase className="h-4 w-4" />
              <AlertTitle>Instructor</AlertTitle>
              <AlertDescription>
                <p><strong>Email:</strong> instructor@gmail.com</p>
                <p><strong>Password:</strong> Instructor@123</p>
              </AlertDescription>
            </Alert>
             <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Admin</AlertTitle>
              <AlertDescription>
                <p><strong>Email:</strong> admin@gmail.com</p>
                <p><strong>Password:</strong> Admin@123</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Instructor Role */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Instructor</CardTitle>
              </div>
              <CardDescription>Create courses, manage content, and grade assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/instructor/dashboard">Dashboard</Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/instructor/rubric-generator">AI Rubric Generator</Link>
              </Button>
               <p className="text-sm text-muted-foreground pt-2">Note: To test course editing and grading, first create a course from the dashboard.</p>
            </CardContent>
          </Card>

          {/* Student Role */}
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Student</CardTitle>
              </div>
              <CardDescription>Enroll in courses, submit work, and track progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/student/dashboard">Dashboard</Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/student/courses">Course Catalog</Link>
              </Button>
               <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/student/writing-center">AI Writing Center</Link>
              </Button>
               <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/student/portfolio">Portfolio</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Role */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Admin</CardTitle>
              </div>
              <CardDescription>Monitor platform usage and system health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/dashboard">Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
            <h2 className="font-headline text-xl font-bold">Authentication</h2>
            <p className="text-muted-foreground mb-4">You'll need to sign up and sign in for each role to test them.</p>
            <div className="flex justify-center gap-4">
                 <Button asChild>
                    <Link href="/login">Sign In</Link>
                </Button>
                 <Button asChild variant="secondary">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        </div>
      </div>
    </main>
  );
}
