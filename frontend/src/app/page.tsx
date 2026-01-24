import { SubscribeForm } from '@/components/subscribe-form';
import { Mail, Shield, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
          Stay in the loop
        </h1>
        <p className="text-xl text-white/80 mb-8">
          Get the latest insights, stories, and updates delivered straight to your inbox.
          Join our community of readers.
        </p>

        <div className="max-w-md mx-auto glass rounded-2xl p-6">
          <SubscribeForm />
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
          <div className="glass rounded-xl p-6 hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Weekly Updates</h3>
            <p className="text-sm text-muted-foreground">
              Curated content delivered to your inbox every week.
            </p>
          </div>
          <div className="glass rounded-xl p-6 hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No Spam</h3>
            <p className="text-sm text-muted-foreground">
              We respect your inbox. Unsubscribe anytime with one click.
            </p>
          </div>
          <div className="glass rounded-xl p-6 hover:translate-y-[-4px] transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
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
