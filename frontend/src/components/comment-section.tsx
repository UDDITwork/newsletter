'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getComments, addComment, type Comment } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Reply, Loader2 } from 'lucide-react';

interface CommentSectionProps {
  slug: string;
}

function CommentItem({
  comment,
  slug,
  onReplyAdded,
  depth = 0,
}: {
  comment: Comment;
  slug: string;
  onReplyAdded: (comment: Comment) => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      const result = await addComment(slug, replyContent, comment.id);
      onReplyAdded(result.comment);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add reply',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = comment.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={depth > 0 ? 'ml-8 mt-4' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          {depth === 0 && user && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-11 mt-3">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleReply} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reply'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          slug={slug}
          onReplyAdded={onReplyAdded}
          depth={1}
        />
      ))}
    </div>
  );
}

export function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchComments() {
      try {
        const data = await getComments(slug);
        setComments(data.comments);
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [slug]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await addComment(slug, newComment);
      setComments([...comments, result.comment]);
      setNewComment('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyAdded = (reply: Comment) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === reply.id) return reply;
        if (c.replies?.some((r) => r.id === reply.id)) return c;
        // Find parent and add reply
        return {
          ...c,
          replies: [...(c.replies || []), reply],
        };
      })
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments ({comments.length})</h3>
        </div>

        {user ? (
          <div className="mb-6">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              className="mt-2"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Post Comment
            </Button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to join the conversation
            </p>
            <Button variant="outline" size="sm" onClick={login}>
              Sign in
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                slug={slug}
                onReplyAdded={handleReplyAdded}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
