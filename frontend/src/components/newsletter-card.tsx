import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Newsletter } from '@/lib/api';

interface NewsletterCardProps {
  newsletter: Newsletter;
}

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  return (
    <Link href={`/newsletter/${newsletter.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        {newsletter.cover_image && (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <img
              src={newsletter.cover_image}
              alt={newsletter.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <time dateTime={new Date(newsletter.created_at).toISOString()}>
              {formatDate(newsletter.created_at)}
            </time>
          </div>
          <CardTitle className="line-clamp-2">{newsletter.title}</CardTitle>
        </CardHeader>
        {newsletter.excerpt && (
          <CardContent>
            <p className="text-muted-foreground line-clamp-3">
              {newsletter.excerpt}
            </p>
          </CardContent>
        )}
        {newsletter.tags && newsletter.tags.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {newsletter.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-secondary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
