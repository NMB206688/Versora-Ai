import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { courseModules } from "@/lib/data";
import { BookOpen, GripVertical, PlaySquare, FileText, CheckSquare, PlusCircle } from "lucide-react";

export default function CourseEditPage({ params }: { params: { id: string } }) {
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
              <Button variant="ghost" size="icon">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {courseModules.map((module) => (
                <SidebarMenuItem key={module.id} className="group/item">
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton tooltip={module.title} className="flex-1 justify-start">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span>{module.title}</span>
                    </SidebarMenuButton>
                  </div>
                  <ul className="pl-8 space-y-1 py-1 border-l border-dashed ml-4">
                    {module.lessons.map(lesson => (
                        <li key={lesson.id} className="w-full">
                            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 rounded-md">
                                {lesson.type === 'video' && <PlaySquare className="h-4 w-4" />}
                                {lesson.type === 'reading' && <FileText className="h-4 w-4" />}
                                {lesson.type === 'quiz' && <CheckSquare className="h-4 w-4" />}
                                <span>{lesson.title}</span>
                            </a>
                        </li>
                    ))}
                  </ul>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                    <h1 className="font-headline text-3xl font-bold">Introduction to Data Science</h1>
                    <p className="text-muted-foreground">Course ID: {params.id}</p>
                </div>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Publish Course</Button>
            </header>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Edit Lesson: Course Introduction</CardTitle>
                <CardDescription>Modify the details for this video lesson.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Lesson Title</Label>
                  <Input id="lesson-title" defaultValue="Course Introduction" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input id="video-url" defaultValue="https://youtube.com/watch?v=example" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Description</Label>
                  <Textarea id="lesson-description" defaultValue="An introductory video welcoming students to the course and providing an overview of what they will learn." className="min-h-32"/>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
