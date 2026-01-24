'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminNewsletters, getAdminSubscribers, sendNewsletter, AdminNewsletter, AdminSubscriber } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

export default function AdminPage() {
  const [newsletters, setNewsletters] = useState<AdminNewsletter[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [newslettersRes, subscribersRes] = await Promise.all([
        getAdminNewsletters(),
        getAdminSubscribers(),
      ]);
      setNewsletters(newslettersRes.newsletters);
      setSubscribers(subscribersRes.subscribers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNewsletter(id: number, title: string) {
    if (!confirm(`Are you sure you want to send "${title}" to all active subscribers?`)) {
      return;
    }

    setSending(id);
    try {
      const result = await sendNewsletter(id);
      toast({
        title: 'Newsletter Sent',
        description: `Successfully sent to ${result.successCount} subscribers. ${result.failureCount} failed.`,
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send newsletter',
        variant: 'destructive',
      });
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const activeSubscribers = subscribers.filter(s => s.status === 'active');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Subscribers</CardTitle>
            <CardDescription>Total subscribers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{subscribers.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeSubscribers.length} active, {subscribers.length - activeSubscribers.length} pending/unsubscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newsletters</CardTitle>
            <CardDescription>Total newsletters created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{newsletters.length}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {newsletters.filter(n => n.status === 'sent').length} sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Newsletters</CardTitle>
          <CardDescription>Manage and send newsletters to subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {newsletters.length === 0 ? (
            <p className="text-muted-foreground">No newsletters found</p>
          ) : (
            <div className="space-y-4">
              {newsletters.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{newsletter.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {newsletter.status} | Created: {new Date(newsletter.created_at).toLocaleDateString()}
                      {newsletter.sent_at && ` | Sent: ${new Date(newsletter.sent_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSendNewsletter(newsletter.id, newsletter.title)}
                    disabled={sending === newsletter.id}
                    variant={newsletter.status === 'sent' ? 'outline' : 'default'}
                  >
                    {sending === newsletter.id ? 'Sending...' : newsletter.status === 'sent' ? 'Resend' : 'Send to Subscribers'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers List</CardTitle>
          <CardDescription>All subscribers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-muted-foreground">No subscribers found</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{subscriber.email}</p>
                    {subscriber.name && <p className="text-sm text-muted-foreground">{subscriber.name}</p>}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      subscriber.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscriber.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {subscriber.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
