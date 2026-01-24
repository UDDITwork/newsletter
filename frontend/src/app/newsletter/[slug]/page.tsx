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
        <div className="glass rounded-2xl overflow-hidden mb-8">
          {newsletter.cover_image && (
            <div className="aspect-video relative overflow-hidden">
              <img
                src={newsletter.cover_image}
                alt={newsletter.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="p-8">
            <header className="mb-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <time dateTime={new Date(newsletter.created_at).toISOString()}>
                  {formatDate(newsletter.created_at)}
                </time>
                {newsletter.tags && newsletter.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newsletter.tags.map((tag) => (
                      <span
                        key={tag}
                        className="glass-tag px-3 py-1 text-xs rounded-full font-medium"
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
                <p className="text-lg text-muted-foreground">
                  {newsletter.excerpt}
                </p>
              )}
            </header>
          </div>
        </div>

        {newsletter.content && (
          <div className="glass rounded-2xl p-8 mb-8">
            <div
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
          </div>
        )}

        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <LikeButton slug={params.slug} />
            <div className="text-sm text-muted-foreground">
              Share this newsletter
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <CommentSection slug={params.slug} />
        </div>
      </div>
    </article>
  );
}
