'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Assignment, Rubric, RubricCriterion, Submission, Feedback } from '@/lib/definitions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { submitAssignment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

function RubricDisplay({ courseId, moduleId, assignmentId }: { courseId: string; moduleId: string; assignmentId: string; }) {
    const firestore = useFirestore();

    const rubricRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, `courses/${courseId}/modules/${moduleId}/assignments/${assignmentId}/rubric`);
    }, [firestore, courseId, moduleId, assignmentId]);

    const criteriaQuery = useMemoFirebase(() => {
        if (!firestore || !rubricRef) return null;
        // The rubric ID is always "rubric" as it's a singleton document
        return query(collection(rubricRef, 'criteria'), orderBy('order'));
    }, [firestore, rubricRef]);

    const { data: rubric, isLoading: isRubricLoading } = useDoc<Rubric>(rubricRef);
    const { data: criteria, isLoading: areCriteriaLoading } = useCollection<RubricCriterion>(criteriaQuery);

    const isLoading = isRubricLoading || areCriteriaLoading;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (!rubric || !criteria || criteria.length === 0) {
        return (
            <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>No grading rubric is available for this assignment yet.</AlertDescription>
            </Alert>
        )
    }

    if (rubric.status !== 'Approved') {
         return (
            <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>The grading rubric is not yet approved by the instructor.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
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
        </div>
    )
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit for Grading'}
    </Button>
  );
}

function FeedbackSection({ courseId, moduleId, assignmentId, submissionId }: { courseId: string; moduleId: string; assignmentId: string; submissionId: string }) {
    const firestore = useFirestore();

    const feedbackQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'courses', courseId, 'modules', moduleId, 'assignments', assignmentId, 'submissions', submissionId, 'feedback'), orderBy('creationDate'));
    }, [firestore, courseId, moduleId, assignmentId, submissionId]);

    const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

    if (isLoading) {
        return <Card className="shadow-lg mt-8"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>;
    }

    if (!feedback || feedback.length === 0) {
        return null; // Don't show the card if there's no feedback
    }

    return (
        <Card className="shadow-lg mt-8">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Instructor Feedback
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {feedback.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-background">
                        <p className="text-muted-foreground">{item.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">— Graded on {format(new Date(item.creationDate), 'PPP')}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function StudentAssignmentPage({ params }: { params: { courseId: string, moduleId: string, assignmentId: string } }) {
    const firestore = useFirestore();
    const { user, profile } = useUser();
    const { toast } = useToast();

    const assignmentRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId);
    }, [firestore, params.courseId, params.moduleId, params.assignmentId]);

    const { data: assignment, isLoading: isAssignmentLoading } = useDoc<Assignment>(assignmentRef);

    const submissionQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId, 'submissions'),
            where('studentId', '==', user.uid),
            limit(1)
        );
    }, [firestore, user, params.courseId, params.moduleId, params.assignmentId]);

    const { data: submissions, isLoading: isSubmissionLoading } = useCollection<Submission>(submissionQuery);
    const submission = submissions?.[0];

    const studentName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : user?.email || 'Anonymous';

    const [state, formAction] = useActionState(
        submitAssignment.bind(null, params.courseId, params.moduleId, params.assignmentId, user?.uid ?? '', studentName),
        { success: false, message: '' }
    );
    
    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Success' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    const isLoading = isAssignmentLoading || isSubmissionLoading;

    return (
        <div className="container mx-auto">
            <div className="my-6">
                <Button asChild variant="outline">
                    <Link href={`/student/course/${params.courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Course
                    </Link>
                </Button>
            </div>

            <header className="mb-8">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-72" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ) : assignment ? (
                    <>
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="font-headline text-3xl font-bold">{assignment.title}</h1>
                                <p className="text-muted-foreground">Review the instructions and rubric, then submit your work.</p>
                            </div>
                             <div className="text-right text-sm">
                                <p className="font-semibold">Due: {format(new Date(assignment.deadline), 'PPP')}</p>
                                <p className="text-muted-foreground">{assignment.pointsPossible} Points Possible</p>
                            </div>
                        </div>
                    </>
                ) : (
                   <h1 className="font-headline text-3xl font-bold">Assignment Not Found</h1>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     {/* Instructions Card */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                             ) : (
                                <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                                    <p>{assignment?.description}</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>

                     {/* Submission Card */}
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Your Submission</CardTitle>
                            <CardDescription>
                                {submission ? 'Here is your submitted work.' : 'Enter your submission text below. You can only submit once.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                     <Skeleton className="h-48 w-full" />
                                 ) : submission ? (
                                     <div className="space-y-4">
                                         <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
                                            <CheckCircle className="h-4 w-4 !text-green-600" />
                                            <AlertDescription className="flex justify-between items-center">
                                                <span>Submitted on {format(new Date(submission.submissionDate), 'PPP')}</span>
                                                {submission.grade !== undefined && (
                                                    <span className="font-bold text-lg">Grade: {submission.grade} / {assignment?.pointsPossible}</span>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                        <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50 rounded-md border">
                                            {submission.textContent}
                                        </div>
                                     </div>
                                 ) : (
                                    <form action={formAction} className="space-y-4">
                                        <Textarea
                                            name="textContent"
                                            placeholder="Begin writing your submission here..."
                                            className="min-h-72 text-base"
                                            required
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" type="button" disabled>Save Draft</Button>
                                            <SubmitButton />
                                        </div>
                                    </form>
                                 )}
                        </CardContent>
                     </Card>
                     {submission && (
                        <FeedbackSection
                            courseId={params.courseId}
                            moduleId={params.moduleId}
                            assignmentId={params.assignmentId}
                            submissionId={submission.id}
                        />
                     )}
                </div>
                <div className="lg:col-span-1">
                    {/* Rubric Card */}
                    <Card className="shadow-lg sticky top-24">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Grading Rubric</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RubricDisplay
                                courseId={params.courseId}
                                moduleId={params.moduleId}
                                assignmentId={params.assignmentId}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
