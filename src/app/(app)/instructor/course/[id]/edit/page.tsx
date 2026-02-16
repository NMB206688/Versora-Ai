'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { BookOpen, GripVertical, PlaySquare, FileText, CheckSquare, PlusCircle } from 'lucide-react';
import { updateCourse, createModule } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Module } from '@/lib/definitions';

const CourseEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

function CreateModuleButton({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreateModule = () => {
    startTransition(async () => {
      const result = await createModule(courseId);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: "New module created.",
        });
      }
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCreateModule} disabled={isPending}>
      <PlusCircle className="h-4 w-4" />
    </Button>
  );
}

export default function CourseEditPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'courses', params.id);
  }, [firestore, params.id]);

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, `courses/${params.id}/modules`), orderBy('order'));
  }, [firestore, params.id]);

  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);
  const { data: modules, isLoading: areModulesLoading } = useCollection<Module>(modulesQuery);

  const [state, formAction] = useActionState(updateCourse.bind(null, params.id), {
    errors: {},
    message: '',
  });

  const form = useForm<z.infer<typeof CourseEditSchema>>({
    resolver: zodResolver(CourseEditSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description,
      });
    }
  }, [course, form]);

  useEffect(() => {
    if (state?.message && !state.errors) {
      toast({
        title: "Success",
        description: state.message,
      });
    } else if (state?.message && state.errors) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);
  
  const isLoading = isCourseLoading || areModulesLoading;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h2 className="font-headline text-lg">Content</h2>
              </div>
              <CreateModuleButton courseId={params.id} />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {areModulesLoading && (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
              )}
              {modules?.map((module) => (
                <SidebarMenuItem key={module.id} className="group/item">
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton tooltip={module.title} className="flex-1 justify-start">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span>{module.title}</span>
                    </SidebarMenuButton>
                  </div>
                  {/* Lesson list will be dynamic in a future step */}
                  <ul className="pl-8 space-y-1 py-1 border-l border-dashed ml-4">
                    {/* {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="w-full">
                        <a
                          href="#"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 rounded-md"
                        >
                          {lesson.type === 'video' && <PlaySquare className="h-4 w-4" />}
                          {lesson.type === 'reading' && <FileText className="h-4 w-4" />}
                          {lesson.type === 'quiz' && <CheckSquare className="h-4 w-4" />}
                          <span>{lesson.title}</span>
                        </a>
                      </li>
                    ))} */}
                  </ul>
                </SidebarMenuItem>
              ))}
               {!areModulesLoading && modules && modules.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>No modules yet.</p>
                  <p>Click the `+` icon to add your first module.</p>
                </div>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  {isCourseLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-72" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ) : (
                    <>
                      <h1 className="font-headline text-3xl font-bold">{course?.title}</h1>
                      <p className="text-muted-foreground">Course ID: {params.id}</p>
                    </>
                  )}
                </div>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Publish Course</Button>
            </header>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Course Details</CardTitle>
                <CardDescription>Modify the title and description for your course.</CardDescription>
              </CardHeader>
              <CardContent>
                {isCourseLoading ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="flex justify-end">
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form action={formAction} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="title">Course Title</Label>
                            <FormControl>
                              <Input id="title" placeholder="e.g., Introduction to Data Science" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="description">Course Description</Label>
                            <FormControl>
                              <Textarea
                                id="description"
                                placeholder="A detailed description of the course content and objectives."
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => form.reset(course)}>
                          Cancel
                        </Button>
                        <SubmitButton />
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
