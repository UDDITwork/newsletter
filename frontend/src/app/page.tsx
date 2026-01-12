import { SubscribeForm } from '@/components/subscribe-form';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Stay in the loop
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get the latest insights, stories, and updates delivered straight to your inbox.
          Join our community of readers.
        </p>

        <div className="max-w-md mx-auto">
          <SubscribeForm />
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-2xl mb-3">📬</div>
            <h3 className="font-semibold mb-2">Weekly Updates</h3>
            <p className="text-sm text-muted-foreground">
              Curated content delivered to your inbox every week.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">No Spam</h3>
            <p className="text-sm text-muted-foreground">
              We respect your inbox. Unsubscribe anytime with one click.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-semibold mb-2">Join the Discussion</h3>
            <p className="text-sm text-muted-foreground">
              Comment, like, and engage with our community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
