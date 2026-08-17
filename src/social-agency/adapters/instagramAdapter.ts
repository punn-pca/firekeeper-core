import { SimulatedPost, SimulatedComment } from '../types';
import { auth } from '../../lib/firebase';

/**
 * SocialPlatformAdapter Interface
 * 
 * Defines the contract for social media integrations.
 * Currently backed by SimulatedInstagramAdapter for offline & sandbox testing.
 * When official Meta Graph API (Instagram Graph API) credentials are provided in the future,
 * a real MetaInstagramAdapter can implement this exact interface without modifying the Social Agency Engine.
 */
export interface PublishPostOptions {
  decisionId?: string;
  contentHash?: string;
  originIntentId?: string;
}

export interface SocialPlatformAdapter {
  platformName: string;
  isConnected: boolean;
  
  // Feed operations
  fetchRecentFeed(): Promise<SimulatedPost[]>;
  publishPost(content: string, mediaPrompt?: string, tags?: string[], options?: PublishPostOptions): Promise<SimulatedPost>;
  
  // Interaction operations
  postComment(postId: string, comment: string, inReplyToCommentId?: string): Promise<SimulatedComment>;
  likePost(postId: string): Promise<boolean>;
  
  // User interactions
  sendDirectMessage?(recipientHandle: string, message: string): Promise<boolean>;
  
  // Health / Status
  getAccountProfile(): Promise<{
    handle: string;
    displayName: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }>;
}

export class SimulatedInstagramAdapter implements SocialPlatformAdapter {
  platformName = 'Instagram Graph API (Simulated Sandbox)';
  isConnected = true;

  private posts: SimulatedPost[];
  private followersCount = 1420;
  private followingCount = 280;

  constructor(initialPosts: SimulatedPost[]) {
    this.posts = [...initialPosts];
  }

  async fetchRecentFeed(): Promise<SimulatedPost[]> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 100));
    return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async publishPost(content: string, mediaPrompt?: string, tags: string[] = [], options?: PublishPostOptions): Promise<SimulatedPost> {
    await new Promise((r) => setTimeout(r, 150));
    const decisionId = options?.decisionId || `dec_ig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = options?.contentHash || `hash_${Math.abs(content.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16)}`;

    // Deduplicate in simulated feed
    const existing = this.posts.find(p => p.decisionId === decisionId || (p.contentHash === contentHash && p.author.isSelf));
    if (existing) {
      return existing;
    }

    const newPost: SimulatedPost = {
      id: `post_self_${Date.now()}`,
      decisionId,
      contentHash,
      publishStatus: 'GENERATED',
      author: {
        id: 'firekeeper_self',
        name: 'FIRE KEEPER · Autonomous Intelligence',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
        badge: 'Sandbox Generated',
      },
      content,
      mediaType: mediaPrompt ? 'image_prompt' : 'text',
      mediaDescription: mediaPrompt || 'Synthesized strategic concept graphic',
      timestamp: new Date().toISOString(),
      likesCount: Math.floor(Math.random() * 8) + 1,
      commentsCount: 0,
      sharesCount: Math.floor(Math.random() * 3),
      tags: tags.length > 0 ? tags : ['#AIGovernance', '#EpistemicIntelligence', '#FireKeeper'],
      isGoverned: true,
      governanceDecision: 'PASSED',
      apiStatus: 'SANDBOX',
      comments: [],
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  async postComment(postId: string, commentText: string): Promise<SimulatedComment> {
    await new Promise((r) => setTimeout(r, 100));
    const targetPost = this.posts.find((p) => p.id === postId);
    const newComment: SimulatedComment = {
      id: `comm_${Date.now()}`,
      postId,
      author: {
        id: 'firekeeper_self',
        name: 'FIRE KEEPER · AI',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
      },
      content: commentText,
      timestamp: new Date().toISOString(),
      likesCount: 1,
      sentiment: 'constructive',
    };

    if (targetPost) {
      targetPost.comments.push(newComment);
      targetPost.commentsCount += 1;
    }

    return newComment;
  }

  async likePost(postId: string): Promise<boolean> {
    const target = this.posts.find((p) => p.id === postId);
    if (target) {
      target.likesCount += 1;
      return true;
    }
    return false;
  }

  async getAccountProfile() {
    return {
      handle: '@firekeeper_ai',
      displayName: 'FIRE KEEPER · Executive Agency',
      followersCount: this.followersCount,
      followingCount: this.followingCount,
      postsCount: this.posts.filter((p) => p.author.isSelf).length,
    };
  }
}

export class RealInstagramGraphAdapter implements SocialPlatformAdapter {
  platformName = 'Instagram Graph API (Real Production)';
  isConnected = false;

  private accessToken: string;
  private igAccountId: string;
  private posts: SimulatedPost[];

  constructor(initialPosts: SimulatedPost[], accessToken?: string, igAccountId?: string) {
    this.posts = [...initialPosts];
    this.accessToken = accessToken || '';
    this.igAccountId = igAccountId || '';
    this.isConnected = Boolean(this.accessToken && this.igAccountId);
  }

  public updateCredentials(accessToken: string, igAccountId: string) {
    this.accessToken = accessToken;
    this.igAccountId = igAccountId;
    this.isConnected = Boolean(accessToken && igAccountId);
  }

  async fetchRecentFeed(): Promise<SimulatedPost[]> {
    return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async publishPost(content: string, mediaPrompt?: string, tags: string[] = [], options?: PublishPostOptions): Promise<SimulatedPost> {
    const decisionId = options?.decisionId || `dec_ig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = options?.contentHash || `hash_${Math.abs(content.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16)}`;

    // Prevent duplicate execution
    const existing = this.posts.find(p => p.decisionId === decisionId || (p.contentHash === contentHash && p.author.isSelf));
    if (existing && existing.publishStatus === 'PUBLISHED') {
      return existing;
    }

    let postId = `ig_${Date.now()}`;
    let isRealSuccess = false;
    let governanceDecision: 'PASSED' | 'BLOCKED' | 'GUARDED' = 'PASSED';
    let governanceReason = '';
    let apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'OFFLINE' | 'SANDBOX' = this.isConnected ? 'CONNECTED' : 'SANDBOX';
    let badgeText = 'Live Meta API';
    let publishStatus: 'GENERATED' | 'GOVERNANCE_PASSED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'BLOCKED' = this.isConnected ? 'PUBLISHING' : 'GENERATED';

    if (this.isConnected) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch (tokenErr) {
            console.warn('[Real Instagram Adapter] Could not obtain Firebase ID token:', tokenErr);
          }
        }

        const res = await fetch('/api/instagram/publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            accessToken: this.accessToken,
            igAccountId: this.igAccountId,
            content,
            imageUrl: mediaPrompt ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80' : undefined,
            tags,
          }),
        });

        const data = await res.json() as any;
        if (res.ok && data.success) {
          postId = data.postId;
          isRealSuccess = true;
          governanceDecision = 'PASSED';
          apiStatus = 'CONNECTED';
          publishStatus = 'PUBLISHED';
          badgeText = 'Live Meta API';
        } else {
          const isDuplicate = data.status === 'DUPLICATE_CONTENT_BLOCKED' || /duplicate/i.test(data.message || '');
          if (isDuplicate) {
            governanceDecision = 'BLOCKED';
            governanceReason = 'Duplicate Content';
            apiStatus = 'CONNECTED';
            publishStatus = 'BLOCKED';
            badgeText = 'Governance Decision: BLOCKED (Duplicate Content)';
          } else if (res.status === 401) {
            governanceDecision = 'GUARDED';
            governanceReason = 'Authentication Required';
            apiStatus = 'DISCONNECTED';
            publishStatus = 'FAILED';
            badgeText = 'Sandbox Simulation (Auth Required)';
          } else {
            governanceDecision = 'GUARDED';
            governanceReason = data.message || 'Governance Guarded';
            apiStatus = 'CONNECTED';
            publishStatus = 'FAILED';
            badgeText = `Governance Guard: ${data.message || 'Sandbox Mode'}`;
          }
          console.warn('[Real Instagram API Info]: Handled response:', data);
        }
      } catch (err: any) {
        governanceDecision = 'GUARDED';
        governanceReason = 'Network Offline';
        apiStatus = 'OFFLINE';
        publishStatus = 'FAILED';
        badgeText = 'Sandbox Simulation (Offline)';
        console.warn('[Real Instagram API Warning]: Network error:', err.message);
      }
    } else {
      governanceDecision = 'PASSED';
      apiStatus = 'SANDBOX';
      publishStatus = 'GENERATED';
      badgeText = 'Sandbox Simulation (Ready)';
    }

    const newPost: SimulatedPost = {
      id: postId,
      decisionId,
      contentHash,
      publishStatus,
      author: {
        id: 'firekeeper_real',
        name: 'FIRE KEEPER · Real Production',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
        badge: badgeText,
      },
      content,
      mediaType: mediaPrompt ? 'image_prompt' : 'text',
      mediaDescription: mediaPrompt || 'Published Instagram visual asset',
      timestamp: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      tags: tags.length > 0 ? tags : ['#AIGovernance', '#FireKeeperLive'],
      isGoverned: true,
      governanceDecision,
      governanceReason,
      apiStatus,
      platform: 'instagram',
      comments: [],
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  async postComment(postId: string, commentText: string): Promise<SimulatedComment> {
    const targetPost = this.posts.find((p) => p.id === postId);
    const newComment: SimulatedComment = {
      id: `comm_real_${Date.now()}`,
      postId,
      author: {
        id: 'firekeeper_real',
        name: 'FIRE KEEPER · Live API',
        handle: '@firekeeper_ai',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
      },
      content: commentText,
      timestamp: new Date().toISOString(),
      likesCount: 0,
      sentiment: 'constructive',
    };

    if (targetPost) {
      targetPost.comments.push(newComment);
      targetPost.commentsCount += 1;
    }

    return newComment;
  }

  async likePost(postId: string): Promise<boolean> {
    const target = this.posts.find((p) => p.id === postId);
    if (target) {
      target.likesCount += 1;
      return true;
    }
    return false;
  }

  async getAccountProfile() {
    return {
      handle: '@firekeeper_ai',
      displayName: 'FIRE KEEPER · Live Instagram API',
      followersCount: 1420,
      followingCount: 280,
      postsCount: this.posts.filter((p) => p.author.isSelf).length,
    };
  }
}
