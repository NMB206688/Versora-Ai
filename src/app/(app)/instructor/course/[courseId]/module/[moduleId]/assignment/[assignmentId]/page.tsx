'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateAssignment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ClipboardEdit, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const AssignmentEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  pointsPossible: z.coerce.number().min(0, 'Points must be non-negative'),
  deadline: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date format."}),
});

type AssignmentEditForm = z.infer<typeof AssignmentEditSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

export default function AssignmentEditPage({ params }: { params: { courseId: string, moduleId: string, assignmentId: string } }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const assignmentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId);
  }, [firestore, params.courseId, params.moduleId, params.assignmentId]);
  
  const { data: assignment, isLoading: isAssignmentLoading } = useDoc(assignmentRef);

  const [state, formAction] = useActionState(updateAssignment.bind(null, params.courseId, params.moduleId, params.assignmentId), {
    errors: {},
    message: '',
  });

  const form = useForm<AssignmentEditForm>({
    resolver: zodResolver(AssignmentEditSchema),
    defaultValues: {
      title: '',
      description: '',
      pointsPossible: 100,
      deadline: '',
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description,
        pointsPossible: assignment.pointsPossible,
        // Format the date for the input[type=date] which expects 'yyyy-MM-dd'
        deadline: assignment.deadline ? format(new Date(assignment.deadline), 'yyyy-MM-dd') : '',
      });
    }
  }, [assignment, form]);

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

  const isLoading = isAssignmentLoading;

  return (
    <div className="container mx-auto">
       <div className="my-6">
            <Button asChild variant="outline">
                <Link href={`/instructor/course/${params.courseId}/edit`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Course Editor
                </Link>
            </Button>
        </div>

      <header className="mb-8">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <ClipboardEdit className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-headline text-3xl font-bold">{assignment?.title}</h1>
                <p className="text-muted-foreground">Editing Assignment</p>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Assignment Details</CardTitle>
                <CardDescription>Modify the title, description, points, and deadline for this assignment.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-16" /><Skeleton className="h-32 w-full" />
                    <div className="flex gap-4"><div className="w-1/2 space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div><div className="w-1/2 space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div></div>
                    <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form action={formAction} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Assignment Title</Label>
                            <FormControl><Input placeholder="e.g., Research Paper: Final Draft" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Description / Instructions</Label>
                            <FormControl><Textarea placeholder="Provide detailed instructions for the assignment." className="min-h-48" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="pointsPossible"
                            render={({ field }) => (
                              <FormItem>
                                <Label>Points Possible</Label>
                                <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                              <FormItem>
                                <Label>Deadline</Label>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => form.reset({
                            title: assignment.title,
                            description: assignment.description,
                            pointsPossible: assignment.pointsPossible,
                            deadline: assignment.deadline ? format(new Date(assignment.deadline), 'yyyy-MM-dd') : '',
                          })}>
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
        <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-24">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Grading Rubric</CardTitle>
                    <CardDescription>Generate, view, and edit the rubric for this assignment.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p className="mb-4">No rubric has been created for this assignment yet.</p>
                    <Button>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
