'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ClipboardList, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import type { Assignment, Rubric, RubricCriterion } from '@/lib/definitions';
import { Alert, AlertDescription } from '@/components/ui/alert';

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


export default function StudentAssignmentPage({ params }: { params: { courseId: string, moduleId: string, assignmentId: string } }) {
    const firestore = useFirestore();

    const assignmentRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'courses', params.courseId, 'modules', params.moduleId, 'assignments', params.assignmentId);
    }, [firestore, params.courseId, params.moduleId, params.assignmentId]);

    const { data: assignment, isLoading: isAssignmentLoading } = useDoc<Assignment>(assignmentRef);

    // Placeholder for submission logic
    // const { data: submission, isLoading: isSubmissionLoading } = useDoc(...)

    const isLoading = isAssignmentLoading; // || isSubmissionLoading;

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
                            <CardDescription>Enter your submission text below. You can save a draft or submit for grading.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                 {isLoading ? (
                                     <Skeleton className="h-48 w-full" />
                                 ) : (
                                    <Textarea
                                        placeholder="Begin writing your submission here..."
                                        className="min-h-72 text-base"
                                    />
                                 )}
                                 <div className="flex justify-end gap-2">
                                     <Button variant="outline" disabled>Save Draft</Button>
                                     <Button disabled>Submit for Grading</Button>
                                 </div>
                            </form>
                        </CardContent>
                     </Card>
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
