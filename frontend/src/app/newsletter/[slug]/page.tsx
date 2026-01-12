import { notFound } from 'next/navigation';
import { getNewsletter } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { LikeButton } from '@/components/like-button';
import { CommentSection } from '@/components/comment-section';

interface PageProps {
  params: { slug: string };
}

export const revalidate = 60;

export default async function NewsletterPage({ params }: PageProps) {
  let newsletter = null;

  try {
    const data = await getNewsletter(params.slug);
    newsletter = data.newsletter;
  } catch {
    notFound();
  }

  if (!newsletter) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {newsletter.cover_image && (
          <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
            <img
              src={newsletter.cover_image}
              alt={newsletter.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <time dateTime={new Date(newsletter.created_at).toISOString()}>
              {formatDate(newsletter.created_at)}
            </time>
            {newsletter.tags && newsletter.tags.length > 0 && (
              <div className="flex gap-2">
                {newsletter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-secondary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {newsletter.title}
          </h1>
          {newsletter.excerpt && (
            <p className="text-xl text-muted-foreground">
              {newsletter.excerpt}
            </p>
          )}
        </header>

        {newsletter.content && (
          <div
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: newsletter.content }}
          />
        )}

        <div className="flex items-center justify-between border-t border-b py-4 mb-12">
          <LikeButton slug={params.slug} />
          <div className="text-sm text-muted-foreground">
            Share this newsletter
          </div>
        </div>

        <CommentSection slug={params.slug} />
      </div>
    </article>
  );
}
