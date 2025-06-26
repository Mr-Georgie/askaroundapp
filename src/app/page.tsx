import QuestionCard from '@/components/QuestionCard';
import { getQuestions } from '@/lib/data';

export default async function Home() {
  const questions = await getQuestions();

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div 
          key={question.id} 
          className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500" 
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <QuestionCard question={question} />
        </div>
      ))}
    </div>
  );
}
