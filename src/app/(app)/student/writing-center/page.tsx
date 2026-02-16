'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { getWritingFeedback } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, FileText, Bot, MessageCircle, Network, Quote, SpellCheck, Info } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useUser } from '@/firebase';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = {
  feedbackItems: null,
  errors: {},
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
      <Sparkles className="mr-2 h-4 w-4" />
      {pending ? 'Analyzing...' : 'Get Feedback'}
    </Button>
  );
}

const feedbackIcons: Record<string, React.ReactNode> = {
  Clarity: <MessageCircle />,
  Structure: <Network />,
  Citation: <Quote />,
  Grammar: <SpellCheck />,
  General: <Info />,
};

export default function WritingCenterPage() {
  const [state, dispatch] = useActionState(getWritingFeedback, initialState);
  const form = useForm(); // For displaying form-level errors
  const { user } = useUser();

  return (
    <div className="container mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold">AI Writing Center</h1>
        <p className="text-muted-foreground mt-2">
          Get instant feedback on your writing. Focus on clarity, structure, and citations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-xl h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Your Text</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form action={dispatch} className="space-y-6">
                  {user && <input type="hidden" name="userId" value={user.uid} />}
                  <FormField
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            name="text"
                            placeholder="Paste your essay, report, or any text here..."
                            className="min-h-[400px] text-base"
                            required
                          />
                        </FormControl>
                         {state?.errors?.text && (
                            <FormMessage>{state.errors.text[0]}</FormMessage>
                         )}
                      </FormItem>
                    )}
                  />
                  <SubmitButton />
                   {state?.message && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="shadow-xl sticky top-24">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">AI Feedback</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="min-h-[468px]">
              {useFormStatus().pending ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Sparkles className="h-10 w-10 text-accent animate-pulse" />
                  <p className="text-muted-foreground">Generating feedback...</p>
                </div>
              ) : state.feedbackItems && state.feedbackItems.length > 0 ? (
                <div className="space-y-4">
                  {state.feedbackItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary p-2 rounded-full mt-1">
                        {feedbackIcons[item.type] || <Info />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.type}</h4>
                        <p className="text-muted-foreground text-sm">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                   <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Your feedback will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
