'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import Link from 'next/link';

// Placeholder data - in a real scenario, this would come from Firestore
const portfolioItems = [
  {
    id: '1',
    assignmentTitle: 'The Impact of AI on Modern Art',
    courseTitle: 'Introduction to Art History',
    grade: 95,
    reflection: 'This was my favorite paper. I was able to combine my interest in technology with the course material, and I am proud of the analysis I produced, especially regarding generative art models.',
    submissionExcerpt: 'The advent of artificial intelligence has irrevocably altered the landscape of artistic creation. From style transfer algorithms that mimic the brushstrokes of masters to generative adversarial networks (GANs) that create entirely novel visual works, AI is not merely a tool but a collaborative partner in the artistic process...',
  },
  {
    id: '2',
    assignmentTitle: 'Data Analysis Project: Housing Market Trends',
    courseTitle: 'Data Science 101',
    grade: 98,
    reflection: 'This project was challenging but incredibly rewarding. Cleaning the dataset was a huge undertaking, but it led to some fascinating insights. The visualization I created for price distribution was particularly effective in communicating my findings.',
    submissionExcerpt: 'The analysis of the metropolitan housing dataset reveals a significant correlation between proximity to public transit and median housing price appreciation over the past decade. Utilizing a linear regression model, we can project a 15% increase in property value for homes within a 0.5-mile radius of a new transit station...',
  }
];

export default function PortfolioPage() {
  const hasItems = portfolioItems.length > 0;

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Learning Portfolio
        </h1>
        <p className="text-muted-foreground">A curated collection of your best work.</p>
      </div>
      
      {hasItems ? (
        <div className="grid gap-8 md:grid-cols-2">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{item.assignmentTitle}</CardTitle>
                <CardDescription>From: {item.courseTitle} | Grade: <span className="font-bold text-primary">{item.grade}%</span></CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground italic mb-4">
                  <p>&quot;{item.submissionExcerpt}&quot;</p>
                </div>
                <h4 className="font-semibold text-sm mb-1">My Reflection</h4>
                <p className="text-sm text-muted-foreground">{item.reflection}</p>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" className="w-full">View Full Submission</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg py-20">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-headline text-xl">Your Portfolio is Empty</h3>
          <p className="mt-2 mb-4">Add your best graded assignments to build a showcase of your learning journey.</p>
          <Button asChild>
            <Link href="/student/dashboard">Find an Assignment to Add</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
