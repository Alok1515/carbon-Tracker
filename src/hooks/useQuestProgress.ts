import { useCallback } from 'react';
import { toast } from 'sonner';

export function useQuestProgress(userId: string | undefined) {
  const trackProgress = useCallback(
    async (action: string, progressIncrement: number = 1) => {
      if (!userId) return;

      try {
        // Get all active quests for this action
        const questsResponse = await fetch('/api/daily-quests');
        if (!questsResponse.ok) return; 
        
        const allQuests = await questsResponse.json();
        const relevantQuests = allQuests.filter((q: any) => q.action === action && q.isActive);

          // Update progress for each relevant quest
          for (const quest of relevantQuests) {
            // Check current progress before updating
            const currentProgressResponse = await fetch(`/api/user-daily-quests?userId=${userId}`);
            let wasAlreadyCompleted = false;
            
            if (currentProgressResponse.ok) {
              const currentQuests = await currentProgressResponse.json();
              const currentQuest = currentQuests.find((q: any) => q.questId === quest.questId);
              wasAlreadyCompleted = currentQuest?.userProgress?.completed || false;
            }

            const response = await fetch('/api/user-daily-quests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                questId: quest.questId,
                progressIncrement
              })
            });

            if (response.ok) {
              const data = await response.json();
              
              // Only show toast if quest just completed (not already completed)
              if (data.completed && !wasAlreadyCompleted) {
                toast.success(`Quest Complete! 🎉`, {
                  description: `Go to Gamification to claim your ${quest.points} points!`
                });
              }
            }
          }
      } catch (error) {
        console.error('Error tracking quest progress:', error);
      }
    },
    [userId]
  );

  return { trackProgress };
}
