'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { getLikes, toggleLike } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  slug: string;
}

export function LikeButton({ slug }: LikeButtonProps) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLikes() {
      try {
        const data = await getLikes(slug);
        setCount(data.count);
        setLiked(data.userHasLiked);
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    }
    fetchLikes();
  }, [slug]);

  const handleToggle = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like this newsletter.',
      });
      return;
    }

    try {
      const data = await toggleLike(slug);
      setLiked(data.liked);
      setCount(data.count);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'gap-2 transition-colors',
        liked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      <span>{count}</span>
    </Button>
  );
}
