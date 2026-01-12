const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Newsletter subscription
export async function subscribe(email: string, name?: string) {
  return fetchApi<{ success: boolean; message: string }>('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
}

export async function confirmSubscription(token: string) {
  return fetchApi<{ success: boolean; message: string }>(`/newsletter/confirm/${token}`);
}

export async function unsubscribe(token: string) {
  return fetchApi<{ success: boolean; message: string }>(`/newsletter/unsubscribe/${token}`);
}

// Authentication
export async function requestLogin(email: string, returnUrl?: string) {
  return fetchApi<{ success: boolean; message: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, returnUrl }),
  });
}

export async function verifyMagicLink(token: string) {
  return fetchApi<{
    success: boolean;
    subscriber?: {
      id: number;
      email: string;
      name: string | null;
      status: string;
    };
  }>(`/auth/verify/${token}`);
}

export async function getCurrentUser() {
  return fetchApi<{
    subscriber: {
      id: number;
      email: string;
      name: string | null;
      status: string;
    } | null;
  }>('/auth/me');
}

export async function logout() {
  return fetchApi<{ success: boolean; message: string }>('/auth/logout', {
    method: 'POST',
  });
}

// Newsletters
export interface Newsletter {
  id: number;
  title: string;
  slug: string;
  subject?: string;
  content?: string;
  mdx_content?: string;
  excerpt?: string;
  cover_image?: string;
  created_at: number;
  sent_at?: number;
  author_id?: string;
  tags: string[];
}

export async function getNewsletters(page = 1, limit = 10) {
  return fetchApi<{
    newsletters: Newsletter[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/newsletters?page=${page}&limit=${limit}`);
}

export async function getNewsletter(slug: string) {
  return fetchApi<{ newsletter: Newsletter }>(`/newsletter/${slug}`);
}

// Likes
export async function getLikes(slug: string) {
  return fetchApi<{ count: number; userHasLiked: boolean }>(`/newsletter/${slug}/likes`);
}

export async function toggleLike(slug: string) {
  return fetchApi<{ liked: boolean; count: number }>(`/newsletter/${slug}/likes`, {
    method: 'POST',
  });
}

// Comments
export interface Comment {
  id: number;
  content: string;
  createdAt: number;
  author: {
    id: number;
    name: string;
  };
  replies: Comment[];
}

export async function getComments(slug: string) {
  return fetchApi<{ comments: Comment[] }>(`/newsletter/${slug}/comments`);
}

export async function addComment(slug: string, content: string, parentId?: number) {
  return fetchApi<{ success: boolean; comment: Comment }>(`/newsletter/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId }),
  });
}
