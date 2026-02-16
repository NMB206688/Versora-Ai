'use client';

import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaySquare, FileText, CheckSquare, Link as LinkIcon, ArrowLeft, ClipboardEdit } from 'lucide-react';
import type { Course, Module, ContentItem, Assignment } from '@/lib/definitions';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ContentItemsList({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const firestore = useFirestore();

  const contentItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `courses/${courseId}/modules/${moduleId}/contentItems`), orderBy('order'));
  }, [firestore, courseId, moduleId]);

  const { data: contentItems, isLoading } = useCollection<ContentItem>(contentItemsQuery);

  const itemIcons: Record<ContentItem['type'], React.ReactNode> = {
    video: <PlaySquare className="h-4 w-4 text-primary" />,
    reading: <FileText className="h-4 w-4 text-primary" />,
    document: <FileText className="h-4 w-4 text-primary" />,
    quiz: <CheckSquare className="h-4 w-4 text-primary" />,
    link: <LinkIcon className="h-4 w-4 text-primary" />,
  };

  if (isLoading) {
    return (
      <div className="pl-4 py-2 space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  if (!contentItems || contentItems.length === 0) {
    return <p className="pl-4 py-2 text-sm text-muted-foreground">No content items in this module yet.</p>
  }

  return (
    <ul className="pl-4 py-2 space-y-1">
      {contentItems.map((item) => (
        <li key={item.id}>
          <Link
            href="#"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
          >
            {itemIcons[item.type] || <FileText className="h-4 w-4" />}
            <span className="flex-1">{item.title}</span>
            {item.type === 'video' && <span className="text-xs text-muted-foreground">12:30</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AssignmentsList({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const firestore = useFirestore();

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `courses/${courseId}/modules/${moduleId}/assignments`), orderBy('order'));
  }, [firestore, courseId, moduleId]);

  const { data: assignments, isLoading } = useCollection<Assignment>(assignmentsQuery);

  if (isLoading) {
    return (
      <div className="pl-4 py-2 space-y-2 mt-2 pt-4 border-t">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 pt-3 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground px-4 mb-1">ASSIGNMENTS</h4>
      <ul className="pl-4 pb-1 space-y-1">
        {assignments.map((item) => (
          <li key={item.id}>
            <Link
              href={`/student/course/${courseId}/module/${moduleId}/assignment/${item.id}`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
            >
              <ClipboardEdit className="h-4 w-4 text-primary" />
              <span className="flex-1">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                Due: {new Date(item.deadline).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StudentCoursePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'courses', params.id);
  }, [firestore, params.id]);

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, `courses/${params.id}/modules`), orderBy('order'));
  }, [firestore, params.id]);

  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);
  const { data: modules, isLoading: areModulesLoading } = useCollection<Module>(modulesQuery);

  const isLoading = isCourseLoading || areModulesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="my-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-1 space-y-4">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
        <div className="container mx-auto text-center py-20">
            <h2 className="font-headline text-2xl">Course not found</h2>
            <p className="text-muted-foreground">We couldn't find the course you're looking for.</p>
            <Button asChild className="mt-4">
                <Link href="/student/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="container mx-auto">
        <div className="my-6">
            <Button asChild variant="outline">
                <Link href="/student/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        
        <header className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8">
             <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={course.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                 <h1 className="font-headline text-4xl md:text-5xl font-bold text-white shadow-2xl">{course.title}</h1>
                 <p className="text-lg text-white/90 mt-2">{course.instructorName}</p>
              </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <h2 className="font-headline text-2xl font-bold mb-4">Course Content</h2>
                <Accordion type="single" collapsible className="w-full" defaultValue={`item-${modules?.[0]?.id}`}>
                    {modules?.map((module) => (
                        <AccordionItem value={`item-${module.id}`} key={module.id} className="border-b-0 mb-4 rounded-lg bg-card shadow-sm overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline text-lg font-semibold">
                                {module.title}
                            </AccordionTrigger>
                            <AccordionContent>
                                <ContentItemsList courseId={params.id} moduleId={module.id} />
                                <AssignmentsList courseId={params.id} moduleId={module.id} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                 {!areModulesLoading && (!modules || modules.length === 0) && (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg py-12">
                        <h3 className="font-headline text-xl">Content Coming Soon</h3>
                        <p className="mt-2">The instructor is still preparing content for this course.</p>
                    </div>
                )}
            </div>
            <div className="md:col-span-1">
                 <h2 className="font-headline text-2xl font-bold mb-4">About this Course</h2>
                 <p className="text-muted-foreground">{course.description}</p>
            </div>
        </div>
    </div>
  );
}
