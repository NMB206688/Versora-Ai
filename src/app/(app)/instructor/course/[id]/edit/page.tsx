'use client';

import { useActionState, useEffect, useTransition, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { BookOpen, GripVertical, PlaySquare, FileText, CheckSquare, PlusCircle, Link as LinkIcon, ClipboardEdit } from 'lucide-react';
import { updateCourse, createModule, createContentItem, createAssignment, updateContentItem, toggleCoursePublished } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Module, ContentItem, Assignment, Course } from '@/lib/definitions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

const UpdateContentItemSchema = z.object({
    title: z.string().min(1, "Title is required."),
    description: z.string().optional(),
    textContent: z.string().optional(),
    contentUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});
type UpdateContentItemForm = z.infer<typeof UpdateContentItemSchema>;

function EditContentItemDialog({
  isOpen,
  setIsOpen,
  item,
  courseId,
  moduleId
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: ContentItem | null;
  courseId: string;
  moduleId: string;
}) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateContentItem.bind(null, courseId, moduleId, item?.id ?? ''), {
      errors: {},
      message: '',
      success: false,
    });

    const form = useForm<UpdateContentItemForm>({
        resolver: zodResolver(UpdateContentItemSchema),
        defaultValues: {
            title: '',
            description: '',
            textContent: '',
            contentUrl: ''
        },
    });

    useEffect(() => {
        if (item) {
            form.reset({
                title: item.title || '',
                description: item.description || '',
                textContent: item.textContent || '',
                contentUrl: item.contentUrl || '',
            });
        }
    }, [item, form]);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.success ? "Success" : "Error",
                description: state.message,
                variant: state.success ? "default" : "destructive",
            });
            if (state.success) {
                setIsOpen(false);
            }
        }
    }, [state, toast, setIsOpen]);

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                 <Form {...form}>
                    <form action={formAction} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle className="font-headline text-2xl">Edit {item.type}</DialogTitle>
                            <DialogDescription>
                                Make changes to your content item. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Content item title" {...field} />
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
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A short description of this content item" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            {(item.type === 'reading' || item.type === 'document') && (
                                <FormField
                                    control={form.control}
                                    name="textContent"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                        <Textarea placeholder="Enter the text for this reading." className="min-h-48" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}

                             {(item.type === 'video' || item.type === 'link') && (
                                <FormField
                                    control={form.control}
                                    name="contentUrl"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <SubmitButton />
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}


function ContentItemsList({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const contentItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `courses/${courseId}/modules/${moduleId}/contentItems`), orderBy('order'));
  }, [firestore, courseId, moduleId]);

  const { data: contentItems, isLoading } = useCollection<ContentItem>(contentItemsQuery);

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleCreateContentItem = (type: ContentItem['type']) => {
    startTransition(async () => {
      const result = await createContentItem(courseId, moduleId, type);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: `New ${type} created.`,
        });
      }
    });
  };

  const itemIcons = {
    video: <PlaySquare className="h-4 w-4" />,
    reading: <FileText className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
    quiz: <CheckSquare className="h-4 w-4" />,
    link: <LinkIcon className="h-4 w-4" />,
  };

  return (
    <>
      <ul className="pl-8 space-y-1 py-1 border-l border-dashed ml-4">
        {isLoading && (
          <div className="space-y-2 py-1">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        )}
        {contentItems?.map((item) => (
          <li key={item.id} className="w-full">
            <button
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 rounded-md w-full text-left"
            >
              {itemIcons[item.type] || <FileText className="h-4 w-4" />}
              <span>{item.title}</span>
            </button>
          </li>
        ))}
        <li className="w-full mt-2">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" disabled={isPending}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Content Item
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCreateContentItem('reading')}>
                      <FileText className="mr-2 h-4 w-4" /> Reading
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateContentItem('video')}>
                      <PlaySquare className="mr-2 h-4 w-4" /> Video
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateContentItem('quiz')}>
                      <CheckSquare className="mr-2 h-4 w-4" /> Quiz
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateContentItem('link')}>
                      <LinkIcon className="mr-2 h-4 w-4" /> Link
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
      <EditContentItemDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        item={selectedItem}
        courseId={courseId}
        moduleId={moduleId}
      />
    </>
  );
}

function AssignmentsList({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `courses/${courseId}/modules/${moduleId}/assignments`), orderBy('order'));
  }, [firestore, courseId, moduleId]);

  const { data: assignments, isLoading } = useCollection<Assignment>(assignmentsQuery);

  const handleCreateAssignment = () => {
    startTransition(async () => {
      const result = await createAssignment(courseId, moduleId);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: "New assignment created.",
        });
      }
    });
  };

  return (
    <ul className="pl-8 space-y-1 py-1 border-l border-dashed ml-4 mt-2">
      <li className="list-none text-xs font-semibold text-muted-foreground px-2 pt-2 -ml-2">ASSIGNMENTS</li>
      {isLoading && (
        <div className="space-y-2 py-1">
          <Skeleton className="h-7 w-full" />
        </div>
      )}
      {assignments?.map((item) => (
        <li key={item.id} className="w-full">
          <Link
            href={`/instructor/course/${courseId}/module/${moduleId}/assignment/${item.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 rounded-md"
          >
            <ClipboardEdit className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </li>
      ))}
       <li className="w-full mt-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleCreateAssignment} disabled={isPending}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
      </li>
    </ul>
  );
}

function PublishCourseSwitch({ course }: { course: Course }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handlePublishToggle = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await toggleCoursePublished(course.id, course.published, user.uid);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="flex items-center space-x-2">
          <Switch
            id="publish-switch"
            checked={course.published}
            // Use onCheckedChange to trigger the dialog, not the action directly
            onCheckedChange={() => {}} 
            disabled={isPending}
          />
          <Label htmlFor="publish-switch" className="cursor-pointer">
            {isPending ? 'Updating...' : course.published ? 'Published' : 'Unpublished'}
          </Label>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {course.published
              ? 'Unpublishing this course will make it inaccessible to students. They will not be able to see its content or submit assignments.'
              : 'Publishing this course will make it visible to students in the course catalog, allowing them to enroll and access its content.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublishToggle}>
            {course.published ? 'Yes, Unpublish' : 'Yes, Publish'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);
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
                  <ContentItemsList courseId={params.id} moduleId={module.id} />
                  <AssignmentsList courseId={params.id} moduleId={module.id} />
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
               {course && <PublishCourseSwitch course={course} />}
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
