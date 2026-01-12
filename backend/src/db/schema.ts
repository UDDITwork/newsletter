export const schema = `
-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed')),
  subscribe_date INTEGER NOT NULL,
  confirm_token TEXT,
  unsubscribe_token TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirm_token ON subscribers(confirm_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token);

-- Newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT,
  content TEXT,
  mdx_content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  created_at INTEGER NOT NULL,
  scheduled_for INTEGER,
  sent_at INTEGER,
  author_id TEXT,
  tags TEXT DEFAULT '[]',
  cover_image TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  subscriber_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_subscriber_id ON sessions(subscriber_id);

-- Magic links table
CREATE TABLE IF NOT EXISTS magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL,
  subscriber_id INTEGER NOT NULL,
  parent_id INTEGER,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_newsletter_id ON comments(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_comments_subscriber_id ON comments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL,
  subscriber_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(newsletter_id, subscriber_id),
  FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_likes_newsletter_id ON likes(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_likes_subscriber_id ON likes(subscriber_id);

-- Newsletter analytics table
CREATE TABLE IF NOT EXISTS newsletter_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL,
  subscriber_id INTEGER,
  action TEXT NOT NULL CHECK (action IN ('sent', 'opened', 'clicked', 'unsubscribed')),
  timestamp INTEGER NOT NULL,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_newsletter_id ON newsletter_analytics(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_analytics_action ON newsletter_analytics(action);

-- Subscriber preferences table
CREATE TABLE IF NOT EXISTS subscriber_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER UNIQUE NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  categories TEXT DEFAULT '[]',
  email_format TEXT DEFAULT 'html' CHECK (email_format IN ('html', 'text')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_preferences_subscriber_id ON subscriber_preferences(subscriber_id);
`;
