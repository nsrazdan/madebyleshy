import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthPanel';
import { markLessonStarted, markLessonCompleted, getLessonProgress } from './lib/attempts';

interface LessonTrackerProps {
  lessonSlug: string;
}

export default function LessonTracker({ lessonSlug }: LessonTrackerProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'none' | 'started' | 'completed'>('none');

  useEffect(() => {
    if (!user) return;

    markLessonStarted(lessonSlug);

    getLessonProgress().then(progress => {
      const entry = progress.find(p => p.lesson_slug === lessonSlug);
      if (entry) setStatus(entry.status);
      else setStatus('started');
    });
  }, [user, lessonSlug]);

  const handleComplete = useCallback(async () => {
    await markLessonCompleted(lessonSlug);
    setStatus('completed');
  }, [lessonSlug]);

  if (!user) return null;

  if (status === 'completed') {
    return (
      <div className="lesson-tracker">
        <span className="lesson-tracker-done">completed</span>
      </div>
    );
  }

  return (
    <div className="lesson-tracker">
      <button className="btn" onClick={handleComplete}>
        mark as complete
      </button>
    </div>
  );
}
