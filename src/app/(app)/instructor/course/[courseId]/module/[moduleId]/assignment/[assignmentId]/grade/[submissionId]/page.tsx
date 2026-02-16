'use client';

import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Edit } from 'lucide-react';
import { format } from 'date-fns';
import type { Submission, Rubric, RubricCriterion, Assignment } from '@/lib/definitions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveGradeAndFeedback, getAIAssistedFeedback } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

// Reusable Rubric Display Component
function RubricDisplay({ courseId, moduleId, assignmentId }: { courseId: string; moduleId: string; assignmentId: string; }) {
    const firestore = useFirestore();

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

    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
    }

    if (!rubric || !criteria || criteria.length === 0 || rubric.status !== 'Approved') {
        return (
            <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>No approved grading rubric is available for this assignment.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {criteria.map((criterion) => (
                <div key={criterion.id} className="border bg-background rounded-lg shadow-sm">
                    <div className="p-3 border-b">
                        <h4 className="font-bold text-sm">{criterion.description}</h4>
                        <p className="text-xs text-muted-foreground">Max Points: {criterion.maxPoints}</p>
                    </div>
                    <div className="p-3 grid gap-2">
                        {criterion.levels.map((level, levelIndex) => (
                            <div key={levelIndex} className="grid grid-cols-[80px_1fr] items-start gap-x-2">
                                <span className="font-semibold text-xs text-foreground/80 pt-px">{level.levelName}</span>
                                <p className="text-xs text-muted-foreground">{level.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function GradingSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving...' : 'Save Grade & Feedback'}
        </Button>
    );
}


function GradingForm({ submission, assignment, criteria, courseId, moduleId }: { submission: Submission; assignment: Assignment, criteria: RubricCriterion[] | null; courseId: string; moduleId: string; }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isAIPending, startAITransition] = useTransition();

    // State for controlled form components
    const [grade, setGrade] = useState<string>(submission.grade?.toString() ?? '');
    const [feedbackText, setFeedbackText] = useState('');
    
    const [saveState, saveFormAction] = useActionState(
        saveGradeAndFeedback.bind(null, courseId, moduleId, assignment.id, submission.id, user?.uid ?? ''),
        { success: false, message: '' }
    );
    
    useEffect(() => {
        if (saveState.message) {
            toast({
                title: saveState.success ? 'Success' : 'Error',
                description: saveState.message,
                variant: saveState.success ? 'default' : 'destructive',
            });
        }
    }, [saveState, toast]);

    const handleGetAIFeedback = () => {
        if (!user || !criteria) return;

        startAITransition(async () => {
            const result = await getAIAssistedFeedback({
                submissionText: submission.textContent ?? '',
                assignmentDescription: assignment.description,
                rubricCriteria: criteria,
                userId: user.uid,
            });

            if (result.message) {
                 toast({ title: 'Error', description: result.message, variant: 'destructive' });
            } else {
                setFeedbackText(result.feedbackText);
                if (result.suggestedGrade !== null) {
                    setGrade(result.suggestedGrade.toString());
                }
                toast({
                    title: 'AI Feedback Generated',
                    description: 'Feedback has been added to the text area for your review.',
                });
            }
        });
    };
    
    return (
        <form action={saveFormAction}>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Grade &amp; Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {saveState.message && !saveState.success && (
                        <Alert variant="destructive">
                            <AlertDescription>{saveState.message}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input 
                                id="grade" 
                                name="grade" 
                                type="number" 
                                placeholder="Enter grade" 
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                            />
                        </div>
                        <Button type="button" disabled={isAIPending} className="w-full" onClick={handleGetAIFeedback}>
                            <Edit className="mr-2 h-4 w-4" />
                            {isAIPending ? 'Getting Feedback...' : 'Get AI Feedback'}
                        </Button>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="feedback">General Feedback</Label>
                        <Textarea 
                            id="feedback" 
                            name="feedback" 
                            placeholder="Provide overall feedback for the student, or generate it with AI." 
                            className="min-h-32" 
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                    </div>
                    <GradingSubmitButton />
                </CardContent>
            </Card>
        </form>
    );
}


export default function GradeSubmissionPage({ params }: { params: { courseId: string, moduleId: string, assignmentId: string, submissionId: string } }) {
    const firestore = useFirestore();

    const submissionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId, 'submissions', params.submissionId);
    }, [firestore, params.courseId, params.moduleId, params.assignmentId, params.submissionId]);
    const { data: submission, isLoading: isSubmissionLoading } = useDoc<Submission>(submissionRef);

    const assignmentRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId);
    }, [firestore, params.courseId, params.moduleId, params.assignmentId]);
    const { data: assignment, isLoading: isAssignmentLoading } = useDoc<Assignment>(assignmentRef);

    const rubricRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, `courses/${params.courseId}/modules/${params.moduleId}/assignments/${params.assignmentId}/rubric`);
    }, [firestore, params.courseId, params.moduleId, params.assignmentId]);
    const criteriaQuery = useMemoFirebase(() => {
        if (!firestore || !rubricRef) return null;
        return query(collection(rubricRef, 'criteria'), orderBy('order'));
    }, [firestore, rubricRef]);
    const { data: criteria, isLoading: areCriteriaLoading } = useCollection<RubricCriterion>(criteriaQuery);

    const isLoading = isSubmissionLoading || isAssignmentLoading || areCriteriaLoading;

    return (
        <div className="container mx-auto">
            <div className="my-6">
                <Button asChild variant="outline">
                    <Link href={`/instructor/course/${params.courseId}/module/${params.moduleId}/assignment/${params.assignmentId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignment
                    </Link>
                </Button>
            </div>
            
            <header className="mb-8">
                 {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-72" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                ) : submission ? (
                    <>
                        <h1 className="font-headline text-3xl font-bold">Grade Submission</h1>
                        <p className="text-muted-foreground">
                            Student: <span className="font-semibold">{submission.studentName}</span> | Submitted: {format(new Date(submission.submissionDate), 'PPp')}
                        </p>
                    </>
                ) : (
                    <h1 className="font-headline text-3xl font-bold">Submission Not Found</h1>
                )}
            </header>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Student's Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <Skeleton className="h-96 w-full" />
                             ) : (
                                <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap bg-muted/50 p-6 rounded-md border min-h-96">
                                    {submission?.textContent}
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg sticky top-24">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Grading Rubric</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RubricDisplay
                                courseId={params.courseId}
                                moduleId={params.moduleId}
                                assignmentId={params.assignmentId}
                            />
                        </CardContent>
                    </Card>

                    {submission && assignment && (
                         <GradingForm 
                            submission={submission} 
                            assignment={assignment}
                            criteria={criteria}
                            courseId={params.courseId} 
                            moduleId={params.moduleId} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
