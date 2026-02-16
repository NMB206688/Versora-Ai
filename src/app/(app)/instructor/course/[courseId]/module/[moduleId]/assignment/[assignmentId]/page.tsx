'use client';

import { useActionState, useEffect, useState } from 'react';
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
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { updateAssignment, generateRubricForAssignment, saveRubric } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ClipboardEdit, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GenerateGradingRubricOutput } from '@/ai/flows/generate-grading-rubric';
import type { Rubric, RubricCriterion, Submission } from '@/lib/definitions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AssignmentEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  pointsPossible: z.coerce.number().min(0, 'Points must be non-negative'),
  deadline: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date format."}),
});

type AssignmentEditForm = z.infer<typeof AssignmentEditSchema>;

interface RubricGeneratorState {
  rubric: GenerateGradingRubricOutput | null;
  errors?: {
    assignmentDescription?: string[];
  };
  message?: string;
}

const initialRubricState: RubricGeneratorState = {
  rubric: null,
  errors: {},
};

interface RubricSaveState {
  success: boolean;
  message?: string;
}
const initialSaveState: RubricSaveState = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

function GenerateRubricButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {pending ? 'Generating...' : 'Generate Rubric'}
        </Button>
    )
}

function SaveRubricButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Rubric'}
        </Button>
    )
}

function RubricSection({ courseId, moduleId, assignmentId, assignment }: { courseId: string; moduleId: string; assignmentId: string; assignment: any }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [generatedRubric, setGeneratedRubric] = useState<GenerateGradingRubricOutput | null>(null);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [generationState, generationFormAction] = useActionState(generateRubricForAssignment, initialRubricState);
    const [saveState, saveFormAction] = useActionState(
      saveRubric.bind(null, courseId, moduleId, assignmentId, user?.uid || ''), 
      initialSaveState
    );

    useEffect(() => {
        if (generationState.rubric) {
            setGeneratedRubric(generationState.rubric);
        }
    }, [generationState]);

    useEffect(() => {
        if (saveState.success) {
            toast({
                title: "Success",
                description: saveState.message,
            });
            setDialogOpen(false);
        } else if (saveState.message && !saveState.success) {
             toast({
                variant: "destructive",
                title: "Error",
                description: saveState.message,
            });
        }
    }, [saveState, toast]);

    const rubricRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, `courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}/rubric`);
    }, [firestore, courseId, moduleId, assignmentId]);

    const criteriaQuery = useMemoFirebase(() => {
        if (!firestore || !rubricRef) return null;
        return query(collection(rubricRef, 'criteria'), orderBy('order'));
    }, [firestore, rubricRef]);

    const { data: rubric, isLoading: isRubricLoading } = useDoc<Rubric>(rubricRef);
    const { data: criteria, isLoading: areCriteriaLoading } = useCollection<RubricCriterion>(criteriaQuery);

    const isLoading = isRubricLoading || areCriteriaLoading;

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setGeneratedRubric(null);
        }
        setDialogOpen(open);
    }

    if (isLoading) {
        return (
            <Card className="shadow-lg sticky top-24">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (rubric && criteria && criteria.length > 0) {
        return (
             <Card className="shadow-lg sticky top-24">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Grading Rubric</CardTitle>
                    <CardDescription>This is the approved rubric for the assignment.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto space-y-4">
                     {criteria.map((criterion) => (
                        <div key={criterion.id} className="border bg-background rounded-lg shadow-sm">
                            <div className="p-4 border-b">
                                <h4 className="font-bold text-base">{criterion.description}</h4>
                                <p className="text-sm text-muted-foreground">Max Points: {criterion.maxPoints}</p>
                            </div>
                            <div className="p-4 grid gap-3">
                                {criterion.levels.map((level, levelIndex) => (
                                    <div key={levelIndex} className="grid grid-cols-[100px_1fr] items-start gap-x-4">
                                        <span className="font-semibold text-sm text-foreground/80 pt-px">{level.levelName}</span>
                                        <p className="text-sm text-muted-foreground">{level.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg sticky top-24">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Grading Rubric</CardTitle>
                <CardDescription>Generate, view, and edit the rubric for this assignment.</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
                <p className="mb-4">No rubric has been created for this assignment yet.</p>
                 <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate with AI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                         {generatedRubric ? (
                            <form action={saveFormAction}>
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">Review Generated Rubric</DialogTitle>
                                    <DialogDescription>
                                        Review the AI-generated rubric. You can save it or generate a new one.
                                    </DialogDescription>
                                </DialogHeader>
                                <input type="hidden" name="rubricData" value={JSON.stringify(generatedRubric)} />
                                <div className="my-4 max-h-[60vh] overflow-y-auto p-1 space-y-4">
                                    {generatedRubric.criteria.map((criterion, index) => (
                                        <div key={index} className="border bg-muted/20 rounded-lg">
                                            <div className="p-3 border-b">
                                                <h4 className="font-bold">{criterion.description}</h4>
                                                <p className="text-sm text-muted-foreground">Max Points: {criterion.maxPoints}</p>
                                            </div>
                                            <div className="p-3 grid gap-2">
                                                {criterion.levels.map((level, levelIndex) => (
                                                    <div key={levelIndex} className="grid grid-cols-[90px_1fr] items-start gap-x-3">
                                                        <span className="font-semibold text-xs text-foreground/80 pt-px">{level.levelName}</span>
                                                        <p className="text-xs text-muted-foreground">{level.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setGeneratedRubric(null)}>Generate Again</Button>
                                    <SaveRubricButton />
                                </DialogFooter>
                            </form>
                         ) : (
                             <form action={generationFormAction}>
                                 <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">Generate Grading Rubric</DialogTitle>
                                    <DialogDescription>
                                        Review the assignment details and generate a structured rubric with AI. You'll be able to review it before saving.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <input type="hidden" name="userId" value={user?.uid} />
                                    <div className="grid gap-2">
                                        <Label htmlFor="assignmentDescription">Assignment Description</Label>
                                        <Textarea
                                            id="assignmentDescription"
                                            name="assignmentDescription"
                                            defaultValue={assignment?.description}
                                            className="min-h-32"
                                        />
                                         {generationState?.errors?.assignmentDescription && (
                                            <p className="text-sm text-destructive">{generationState.errors.assignmentDescription[0]}</p>
                                        )}
                                    </div>
                                    {generationState?.message && !generationState.rubric && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{generationState.message}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                                <DialogFooter>
                                    <GenerateRubricButton />
                                </DialogFooter>
                             </form>
                         )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

function SubmissionsList({ courseId, moduleId, assignmentId }: { courseId: string; moduleId: string; assignmentId: string; }) {
  const firestore = useFirestore();

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}/submissions`), orderBy('submissionDate', 'desc'));
  }, [firestore, courseId, moduleId, assignmentId]);

  const { data: submissions, isLoading } = useCollection<Submission>(submissionsQuery);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Student Submissions</CardTitle>
        <CardDescription>Review and grade work submitted by students for this assignment.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : submissions && submissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.studentName}</TableCell>
                  <TableCell>{format(new Date(submission.submissionDate), 'PPp')}</TableCell>
                  <TableCell>
                    <Badge variant={submission.grade ? "secondary" : "default"} className={submission.grade ? '' : 'bg-green-600 hover:bg-green-700'}>
                      {submission.grade ? `Graded (${submission.grade})` : 'Needs Grading'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/instructor/course/${courseId}/module/${moduleId}/assignment/${assignmentId}/grade/${submission.id}`}>
                        <Eye className="mr-2 h-3 w-3" />
                        View &amp; Grade
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No submissions have been made for this assignment yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
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
        <div className="lg:col-span-2 space-y-8">
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
            <SubmissionsList
                courseId={params.courseId}
                moduleId={params.moduleId}
                assignmentId={params.assignmentId}
            />
        </div>
        <div className="lg:col-span-1">
             <RubricSection
                courseId={params.courseId}
                moduleId={params.moduleId}
                assignmentId={params.assignmentId}
                assignment={assignment}
             />
        </div>
      </div>
    </div>
  );
}
