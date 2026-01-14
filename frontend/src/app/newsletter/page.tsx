import { getNewsletters, Newsletter } from '@/lib/api';
import { NewsletterCard } from '@/components/newsletter-card';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function NewsletterListPage() {
  let newsletters: Newsletter[] = [];
  let error: string | null = null;

  try {
    const data = await getNewsletters(1, 20);
    newsletters = data.newsletters;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load newsletters';
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Newsletter Archive</h1>
        <p className="text-muted-foreground mb-8">
          Browse all our past newsletters
        </p>

        {error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No newsletters yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {newsletters.map((newsletter) => (
              <NewsletterCard key={newsletter.id} newsletter={newsletter} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
