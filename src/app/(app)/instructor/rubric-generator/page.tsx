'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createRubric } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, ClipboardCheck, Check, X, Pencil } from 'lucide-react';

const initialState = {
  rubric: null,
  errors: {},
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
      <Sparkles className="mr-2 h-4 w-4" />
      {pending ? 'Generating...' : 'Generate Rubric'}
    </Button>
  );
}

export default function RubricGeneratorPage() {
  const [state, dispatch] = useFormState(createRubric, initialState);

  return (
    <div className="container mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold">AI Rubric Generator</h1>
        <p className="text-muted-foreground mt-2">
          Create fair and effective grading rubrics in seconds.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Assignment Details</CardTitle>
              <CardDescription>Provide the prompt and learning objectives for your assignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-6">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="assignmentPrompt" className="text-lg font-semibold">Assignment Prompt</Label>
                  <Textarea
                    id="assignmentPrompt"
                    name="assignmentPrompt"
                    placeholder="e.g., Write a 5-page research paper on the impact of renewable energy..."
                    className="min-h-[150px]"
                    required
                  />
                  {state?.errors?.assignmentPrompt && (
                    <p className="text-sm text-destructive">{state.errors.assignmentPrompt[0]}</p>
                  )}
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="learningObjectives" className="text-lg font-semibold">Learning Objectives</Label>
                  <Textarea
                    id="learningObjectives"
                    name="learningObjectives"
                    placeholder="e.g., Student will be able to analyze primary sources..."
                    className="min-h-[150px]"
                    required
                  />
                   {state?.errors?.learningObjectives && (
                    <p className="text-sm text-destructive">{state.errors.learningObjectives[0]}</p>
                  )}
                </div>
                <GenerateButton />
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-xl sticky top-24">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-2xl">Generated Rubric</CardTitle>
                    <CardDescription>Review, edit, and approve the AI-generated rubric.</CardDescription>
                  </div>
                  {state.rubric && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                      <Button size="icon" className="bg-green-600 hover:bg-green-700"><Check className="h-4 w-4" /></Button>
                    </div>
                  )}
              </div>
            </CardHeader>
            <CardContent className="min-h-[420px] bg-muted/30 rounded-lg p-4">
              {useFormStatus().pending ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Sparkles className="h-10 w-10 text-accent animate-pulse" />
                  <p className="text-muted-foreground">AI is generating your rubric...</p>
                </div>
              ) : state.rubric ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                  {state.rubric}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Your generated rubric will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
