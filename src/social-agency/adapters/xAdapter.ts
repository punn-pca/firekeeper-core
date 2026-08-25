import { SimulatedPost, SimulatedComment, PublishLifecycleStatus, SocialPlatformAdapter, PublishPostOptions } from '../types';
import { IdempotencyGuard } from '../idempotencyGuard';
import { CadencePolicyManager } from '../cadencePolicy';
import { auth, db, collection, onSnapshot, setDoc, doc } from '../../lib/firebase';

export class RealXAdapter implements SocialPlatformAdapter {
  platformName = 'X (Twitter) API v2 (Real Production)';
  isConnected = false;

  private posts: SimulatedPost[];
  private syncListeners: Array<() => void> = [];

  constructor(initialPosts: SimulatedPost[], isConnected = false) {
    this.posts = this.deduplicatePosts([...initialPosts]);
    this.isConnected = isConnected;
    this.initFirestoreSync(initialPosts);
  }

  public onSync(callback: () => void) {
    this.syncListeners.push(callback);
  }

  private triggerSyncNotify() {
    this.syncListeners.forEach(cb => {
      try { cb(); } catch {}
    });
  }

  private initFirestoreSync(initialPosts: SimulatedPost[]) {
    try {
      const postsCol = collection(db, 'posts');
      onSnapshot(postsCol, async (snapshot) => {
        if (snapshot.empty) {
          console.log('[RealXAdapter] Firestore posts collection is empty. Seeding INITIAL_SIMULATED_POSTS...');
          for (const post of initialPosts) {
            try {
              await setDoc(doc(db, 'posts', post.id), post);
            } catch (seedErr) {
              console.warn(`[RealXAdapter] Failed to seed post ${post.id}:`, seedErr);
            }
          }
          return;
        }

        const list: SimulatedPost[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SimulatedPost);
        });

        this.posts = this.deduplicatePosts(list);
        this.triggerSyncNotify();
      }, (err) => {
        console.warn('[RealXAdapter] Firestore onSnapshot subscription warning:', err);
      });
    } catch (e) {
      console.warn('[RealXAdapter] Failed to initialize Firestore listener:', e);
    }
  }

  public updateConnectionStatus(isConnected: boolean) {
    this.isConnected = isConnected;
  }

  public rejectPost(postId: string) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.publishStatus = 'REJECTED';
      post.governanceDecision = 'SKIPPED';
      post.author.badge = 'Rejected by Human Operator';
      
      // Persist status change to Firestore
      setDoc(doc(db, 'posts', postId), post).catch(err => {
        console.warn(`[RealXAdapter] Failed to write rejected post to Firestore for ${postId}:`, err);
      });
    }
  }

  public updatePostContent(postId: string, newContent: string) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.content = newContent;
      post.contentHash = IdempotencyGuard.generateContentHash(newContent);
      
      // Persist content update to Firestore
      setDoc(doc(db, 'posts', postId), post).catch(err => {
        console.warn(`[RealXAdapter] Failed to write updated post to Firestore for ${postId}:`, err);
      });
    }
  }

  // Deprecated backward-compatibility helper that does NOT store secrets in client
  public updateCredentials(_apiKey?: string, _apiSecret?: string, accessToken?: string, _accessSecret?: string) {
    this.isConnected = Boolean(accessToken);
  }

  private deduplicatePosts(postsList: SimulatedPost[]): SimulatedPost[] {
    const seenIds = new Set<string>();
    const seenDecisionIds = new Set<string>();
    const result: SimulatedPost[] = [];

    for (const post of postsList) {
      if (post.id && seenIds.has(post.id)) continue;
      if (post.decisionId && seenDecisionIds.has(post.decisionId)) continue;
      
      // If published with xTweetId, ensure only one instance of that tweet
      if (post.xTweetId && seenIds.has(`tweet_${post.xTweetId}`)) continue;

      if (post.id) seenIds.add(post.id);
      if (post.xTweetId) seenIds.add(`tweet_${post.xTweetId}`);
      if (post.decisionId) seenDecisionIds.add(post.decisionId);
      
      result.push(post);
    }
    return result;
  }

  async fetchRecentFeed(): Promise<SimulatedPost[]> {
    this.posts = this.deduplicatePosts(this.posts);
    return [...this.posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async publishPost(content: string, mediaPrompt?: string, tags: string[] = [], options?: PublishPostOptions): Promise<SimulatedPost> {
    const fullText = (tags && tags.length > 0) ? `${content.trim()}\n\n${tags.join(' ')}` : content.trim();
    const decisionId = options?.decisionId || `dec_x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const contentHash = options?.contentHash || IdempotencyGuard.generateContentHash(fullText);
    const publishMode = options?.mode || 'production';

    // 0. Hard Pacing / Cooldown Gate evaluation (Only for top-level production posts)
    if (publishMode === 'production' && !options?.forceOverride) {
      const hardGate = CadencePolicyManager.checkPacingHardGate();
      if (!hardGate.isAllowed) {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=COOLDOWN_SKIPPED status=SKIPPED xTweetId=none reason="${hardGate.reason}"`);
        return {
          id: `skipped_${Date.now()}`,
          decisionId,
          contentHash,
          publishStatus: 'SKIPPED',
          xTweetId: undefined,
          publishError: hardGate.reason,
          author: {
            id: 'firekeeper_x',
            name: 'FIRE KEEPER · Autonomous Intelligence',
            handle: '@punn_firekeeper',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            isSelf: true,
            badge: `Pacing Active (${hardGate.remainingMinutes}m remaining)`,
          },
          content: fullText,
          mediaType: mediaPrompt ? 'image_prompt' : 'text',
          mediaDescription: mediaPrompt || 'Autonomous Strategic Concept',
          timestamp: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          tags: tags.length > 0 ? tags : ['#AIGovernance', '#FireKeeperX'],
          isGoverned: true,
          governanceDecision: 'SKIPPED',
          governanceReason: hardGate.reason,
          apiStatus: 'SANDBOX',
          platform: 'x',
          comments: [],
        };
      }
    }

    // 1. Idempotency Check: 1 Decision = 1 Canonical Record
    const existingByDecision = this.posts.find(p => p.decisionId === decisionId);
    if (existingByDecision) {
      if (existingByDecision.publishStatus === 'PUBLISHED' && existingByDecision.xTweetId) {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=ALREADY_PUBLISHED status=PUBLISHED xTweetId=${existingByDecision.xTweetId}`);
        return existingByDecision;
      }
      if (existingByDecision.publishStatus === 'PUBLISHING') {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=ALREADY_IN_FLIGHT status=PUBLISHING xTweetId=none`);
        return existingByDecision;
      }
    }

    // 2. Deduplication Check by Content Hash for self-posts
    const existingByContent = this.posts.find(p => p.author.isSelf && p.contentHash === contentHash && p.publishStatus === 'PUBLISHED' && p.xTweetId);
    if (existingByContent) {
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=DUPLICATE_CONTENT_PREVENTED status=BLOCKED xTweetId=${existingByContent.xTweetId}`);
      return existingByContent;
    }

    let tweetId: string | undefined = undefined;
    let localPostId = `sandbox_post_${Date.now()}`;
    
    // Human-in-the-loop policy evaluation: Check if actor is HUMAN and approved
    const actor = options?.actor || 'AI';
    const isHumanApproved = actor === 'HUMAN' && options?.approvalStatus === 'APPROVED';
    
    let publishStatus: PublishLifecycleStatus = 'PENDING_APPROVAL';
    let governanceDecision: 'PASSED' | 'BLOCKED' | 'GUARDED' | 'SKIPPED' = 'PASSED';
    let governanceReason = '';
    let apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'OFFLINE' | 'SANDBOX' = 'SANDBOX';
    let badgeText = 'Pending Human Approval';
    let publishError: string | undefined = undefined;

    if (isHumanApproved) {
      publishStatus = this.isConnected ? 'PUBLISHING' : 'GOVERNANCE_PASSED';
      apiStatus = this.isConnected ? 'CONNECTED' : 'SANDBOX';
      badgeText = this.isConnected ? 'Publishing to X...' : 'Sandbox Generated (Not on X)';

      if (this.isConnected) {
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=START_PUBLISH status=PUBLISHING mode=${publishMode} xTweetId=none`);
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          
          // Pass Firebase ID Token if signed in
          if (auth.currentUser) {
            try {
              const token = await auth.currentUser.getIdToken();
              if (token) headers['Authorization'] = `Bearer ${token}`;
            } catch (tokenErr) {
              console.warn('[Real X Adapter] Could not obtain Firebase ID token:', tokenErr);
            }
          }

          // Production-Secure: Never pass raw secrets in request body
          const res = await fetch('/api/x/publish', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              text: fullText,
              mode: publishMode,
              forceOverride: options?.forceOverride,
              actor: 'HUMAN',
              approvalStatus: options?.approvalStatus || 'APPROVED',
              duplicateStatus: options?.duplicateStatus || 'CLEAR',
              governanceStatus: options?.governanceStatus || 'PASSED',
              pacingStatus: options?.pacingStatus || 'READY',
            }),
          });

          const data = await res.json() as any;
          if (res.ok && data.success && data.tweetId) {
            // X Real is the Single Source of Truth for Published Status
            tweetId = String(data.tweetId);
            localPostId = tweetId;
            publishStatus = 'PUBLISHED';
            governanceDecision = 'PASSED';
            apiStatus = 'CONNECTED';
            badgeText = `Live on Real X (${tweetId})${publishMode === 'test' ? ' [Test Mode]' : ''}`;
            console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=PUBLISH_SUCCESS status=PUBLISHED xTweetId=${tweetId}`);
          } else {
            const isDuplicate = data.status === 'DUPLICATE_CONTENT_BLOCKED' || /duplicate/i.test(data.message || data.detail || data.reason || '');
            const isPacingCooldown = data.status === 'PACING_COOLDOWN_ACTIVE' || data.status === 'DAILY_QUOTA_EXCEEDED' || /cooldown|interval|quota/i.test(data.message || data.reason || '');
            if (isDuplicate) {
              publishStatus = 'BLOCKED';
              governanceDecision = 'BLOCKED';
              governanceReason = 'Duplicate content detected';
              apiStatus = 'CONNECTED';
              badgeText = 'Governance: BLOCKED (Duplicate content)';
              publishError = 'Duplicate content detected';
              console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=BLOCKED status=BLOCKED xTweetId=none reason="Duplicate content"`);
            } else if (isPacingCooldown) {
              publishStatus = 'SKIPPED';
              governanceDecision = 'SKIPPED';
              governanceReason = data.reason || data.message || 'Pacing Cooldown Active';
              apiStatus = data.apiStatus || 'CONNECTED';
              badgeText = `Pacing: SKIPPED (${data.reason || 'Cooldown'})`;
              publishError = governanceReason;
              console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=COOLDOWN_SKIPPED status=SKIPPED xTweetId=none reason="${governanceReason}"`);
            } else if (res.status === 401 || data.status === 'TOKEN_EXPIRED') {
              publishStatus = 'FAILED';
              governanceDecision = 'GUARDED';
              governanceReason = 'Token Expired';
              apiStatus = 'DISCONNECTED';
              badgeText = 'X Token Expired (Reauthorization Required)';
              publishError = 'Token Expired';
              console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=AUTH_FAILED status=FAILED xTweetId=none`);
            } else {
              publishStatus = 'FAILED';
              governanceDecision = data.governanceDecision || 'GUARDED';
              governanceReason = data.reason || data.message || 'Governance Intercepted';
              apiStatus = data.apiStatus || 'CONNECTED';
              badgeText = data.message || `X Publish Failed: ${data.reason || 'Protected'}`;
              publishError = governanceReason;
              console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=PUBLISH_ERROR status=FAILED xTweetId=none error="${governanceReason}"`);
            }
          }
        } catch (err: any) {
          publishStatus = 'FAILED';
          governanceDecision = 'GUARDED';
          governanceReason = 'Network Offline';
          apiStatus = 'OFFLINE';
          badgeText = 'X API Offline';
          publishError = err.message;
          console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=NETWORK_ERROR status=FAILED xTweetId=none error="${err.message}"`);
        }
      } else {
        // Sandbox mode: Governance passed locally, but explicitly not published to Real X
        publishStatus = 'GOVERNANCE_PASSED';
        governanceDecision = 'PASSED';
        apiStatus = 'SANDBOX';
        badgeText = 'Sandbox Simulation (Local Only - Not on X)';
        console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=SANDBOX_SIMULATION status=GOVERNANCE_PASSED xTweetId=none`);
      }
    } else {
      // Autonomous agent generated draft: set as pending approval
      publishStatus = 'PENDING_APPROVAL';
      governanceDecision = 'PASSED';
      apiStatus = 'SANDBOX';
      badgeText = 'Pending Human Approval';
      console.log(`[FK:PUBLISH] decisionId=${decisionId} contentHash=${contentHash} action=PENDING_APPROVAL status=PENDING_APPROVAL xTweetId=none`);
    }

    const newPost: SimulatedPost = {
      id: localPostId,
      decisionId,
      contentHash,
      publishStatus,
      xTweetId: tweetId,
      publishedAt: tweetId ? new Date().toISOString() : undefined,
      publishError,
      author: {
        id: 'firekeeper_x',
        name: 'FIRE KEEPER · Autonomous Intelligence',
        handle: '@punn_firekeeper',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        isSelf: true,
        badge: badgeText,
      },
      content: fullText,
      mediaType: mediaPrompt ? 'image_prompt' : 'text',
      mediaDescription: mediaPrompt || 'Autonomous Strategic Concept',
      timestamp: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      tags: tags.length > 0 ? tags : ['#AIGovernance', '#FireKeeperX'],
      isGoverned: true,
      governanceDecision,
      governanceReason,
      apiStatus,
      platform: 'x',
      comments: [],
    };

    // Update existing record if decisionId matched, or prepend new record
    const existingIndex = this.posts.findIndex(p => p.decisionId === decisionId);
    if (existingIndex >= 0) {
      this.posts[existingIndex] = newPost;
    } else {
      this.posts.unshift(newPost);
    }

    this.posts = this.deduplicatePosts(this.posts);

    // Save newly published/updated post to Firestore
    setDoc(doc(db, 'posts', newPost.id), newPost).catch((err) => {
      console.warn(`[RealXAdapter] Failed to save post ${newPost.id} to Firestore:`, err);
    });

    return newPost;
  }

  async postComment(postId: string, commentText: string, inReplyToCommentId?: string): Promise<SimulatedComment> {
    const targetPost = this.posts.find((p) => p.id === postId);
    const targetTweetId = inReplyToCommentId || targetPost?.xTweetId || (postId.match(/^\d+$/) ? postId : undefined);

    let replyTweetId = `tweet_reply_${Date.now()}`;
    let isRealPosted = false;

    if (this.isConnected && targetTweetId) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
          } catch {}
        }

        // Production-Secure: Never pass raw secrets in request body
        const res = await fetch('/api/x/publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: commentText.trim(),
            inReplyToTweetId: targetTweetId,
            mode: 'production',
          }),
        });

        const data = await res.json() as any;
        if (res.ok && data.success && data.tweetId) {
          replyTweetId = String(data.tweetId);
          isRealPosted = true;
          console.log(`[FK:REPLY] Successfully replied to X tweet ${targetTweetId}, reply ID: ${replyTweetId}`);
        } else {
          console.warn('[FK:REPLY] Failed to post reply to Real X, saved to local state:', data.message);
        }
      } catch (err: any) {
        console.warn('[FK:REPLY] Network error replying to Real X:', err.message);
      }
    }

    const newComment: SimulatedComment = {
      id: replyTweetId,
      postId,
      author: {
        id: 'firekeeper_x',
        name: 'FIRE KEEPER · Autonomous Intelligence',
        handle: '@punn_firekeeper',
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
      
      // Save updated post (with comments) to Firestore
      setDoc(doc(db, 'posts', postId), targetPost).catch((err) => {
        console.warn(`[RealXAdapter] Failed to save post with comment ${postId} to Firestore:`, err);
      });
    }

    return newComment;
  }

  async likePost(postId: string): Promise<boolean> {
    const target = this.posts.find((p) => p.id === postId);
    if (target) {
      target.likesCount += 1;
      
      // Save updated post (with incremented likes) to Firestore
      setDoc(doc(db, 'posts', postId), target).catch((err) => {
        console.warn(`[RealXAdapter] Failed to save post like ${postId} to Firestore:`, err);
      });
      return true;
    }
    return false;
  }

  async getAccountProfile() {
    return {
      handle: '@punn_firekeeper',
      displayName: 'Punn · FIRE KEEPER AI',
      followersCount: 2540,
      followingCount: 310,
      postsCount: this.posts.filter((p) => p.author.isSelf && p.publishStatus === 'PUBLISHED' && p.xTweetId).length,
    };
  }
}
