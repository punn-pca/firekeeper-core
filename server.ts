        limit: userPlan.id === 'free' && mode === 'normal' ? 50 : userPlan.dailyAnalysisLimit,
        used: Number(error?.used ?? 0),
        upgradeRequired: true,
      });
    }
    return res.status(503).json({ error: 'USAGE_STORAGE_UNAVAILABLE' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'identity');
  res.flushHeaders();

  let isClientDisconnected = false;
  // Keep intermediaries and mobile/browser clients from treating a long
  // pre-generation phase as an idle/dead SSE connection.
  const streamHeartbeat = setInterval(() => {
    if (!res.writableEnded && !isClientDisconnected) {
      sendSSE('heartbeat', { ts: Date.now() });
    }
  }, 15000);
  const requestAbortController = new AbortController();
  const abortDisconnectedRequest = () => {
    if (res.writableEnded) return;
    isClientDisconnected = true;
    requestAbortController.abort();
  };
  req.on('aborted', abortDisconnectedRequest);
  res.on('close', abortDisconnectedRequest);
  if (res.destroyed) abortDisconnectedRequest();

  const sendSSE = (event: string, data: any) => {
    if (res.writableEnded || isClientDisconnected) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch {
      abortDisconnectedRequest();
    }
  };

  try {
    const startMs = Date.now();
    sendSSE('chat_mode', { mode });

    // ── DUAL-MODE ARCHITECTURE: ROUTE TO NORMAL MODE ──
    if (mode === 'normal') {
      await handleNormalChatStream({
        req,
        res,
        userId,
        userPlan,
        question: missionInstruction ? `[กรอบภารกิจ: ${selectedMission} — ${missionInstruction}]\n\n${question}` : question,
        history,
        tone,
        webSearch,
        model,
        resolvedProvider,
        rawApiKey,
        deepSeekApiKey,
        customBaseUrl,
        ollamaBaseUrl,
        attachedImages,
        hasPdfAttachment,
        normalizedAnalysisRequestId,
        analysisReservationId,
        isClientDisconnected: () => isClientDisconnected,
        requestAbortController,
        sendSSE,
      });
      return;
    }
    // ── END OF NORMAL MODE ROUTE ──

    // 0. Intent Classification (Deterministic Gate)
    const intentClassification = classifyIntent(question || '');
    const intent = intentClassification.type;
    const isMetaInquiry = intent === 'META_INQUIRY';
    // Meta questions audit FIRE KEEPER itself. They must not be routed through
    // external-web retrieval or contextual entity resolution, because the
    // conversation history may contain arbitrary entities that are irrelevant
    // to the system-audit question.
    const effectiveWebSearch = isMetaInquiry ? false : Boolean(webSearch);
    sendSSE('intent_classification', {
      ...intentClassification,
      routingPolicy: isMetaInquiry
        ? 'META_INQUIRY_LOCAL_FIRST'
        : 'STANDARD_QUERY_ROUTING'
    });
    sendSSE('query_routing', {
      intent,
      metaInquiry: isMetaInquiry,
      webSearchRequested: Boolean(webSearch),
      webSearchEffective: effectiveWebSearch,
      contextResolution: isMetaInquiry ? 'SKIPPED' : 'ENABLED_WHEN_NEEDED'
    });

    // 0.1 Adaptive Control Activation Gate
    const runtimeConfig = calculateRuntimeResponseDepth(question, {
      intent,
      deepReasoning: Boolean(deepReasoning),
      attachmentCount: (attachments || []).length
    });
    const activationPlan = runtimeConfig.activationPlan;

    // Force activation if user explicitly requested web search
    if (effectiveWebSearch) {
      activationPlan.evidenceGrounding = 'REQUIRED';
    } else if (isMetaInquiry) {
      activationPlan.evidenceGrounding = 'NOT_REQUIRED';
    }

    sendSSE('activation_plan', activationPlan);

    // Apply Semantic Reranking & Filter to cap at 12 highly relevant chunks
    const rerankResult = rerankAndFilterEvidence(parsedAttachmentChunks, question || '', 12);
    parsedAttachmentChunks = rerankResult.selected;

    const activeCompressedContext = reqCompressed || (history && history.length > 0 ? generateCompressedContext(history) : undefined);
    // The chat request must hydrate its own context; opening the Memory page
    // first is not a prerequisite after a Cloud Run instance restart.
    let userBank: MemoryRecord[];
    try {
      userBank = await hydrateUserMemories(userId);
    } catch (error) {
      console.warn('[Memory Bank] Chat hydration failed:', sanitizeErrorForLog(error));
      userBank = []; // Never inject possibly stale cached records on read failure.
      sendSSE('memory_context_warning', { status: 'UNAVAILABLE', message: 'ไม่สามารถโหลดความจำที่บันทึกไว้ได้ในรอบนี้' });
    }

    userBank = userBank.filter(memory => !restrictedTopic(accountPolicy, [memory.content]));

    // Dynamic Route Knowledge matching
    const routerResult = routeKnowledge(question || '', attachments || []);

    // Firekeeper Publication Knowledge Base is opt-in by query intent.
    // Do not inject the corpus into general questions just because semantic similarity exists.
    const institutionalIntent = hasInstitutionalKnowledgeIntent(question || '');
    const institutionalKnowledge = institutionalIntent ? await retrieveInstitutionalKnowledgeHybrid(question || '', 5) : [];
    const publicationRoute = await resolvePublicationEvidence(question || '');
    const publicationIntent = publicationRoute.intent;
    const publicationInventory = publicationRoute.inventory;
    const publicationKnowledge = publicationRoute.chunks;
    const publicationNeedsWeb = publicationRoute.needsWeb;
    // Current-news and time-sensitive requests must use live web evidence even if the
    // browser toggle was previously saved as OFF. This prevents silent fallback to
    // the no-evidence response for queries such as "ข่าวเอไอ" or "ข่าวล่าสุด".
    const autoWebSearch = !isMetaInquiry && /ข่าว|ล่าสุด|วันนี้|เมื่อวาน|สัปดาห์นี้|เดือนนี้|current|latest|news/i.test(question || '');
    const allowWebRetrieval = !isMetaInquiry
      && Boolean(effectiveWebSearch || autoWebSearch)
      && (!publicationIntent || publicationNeedsWeb);
    sendSSE('knowledge_route', {
      scope: publicationIntent ? 'PUBLICATION' : 'GENERAL',
      publicationCount: publicationKnowledge.length,
      inventoryCount: publicationInventory.length,
      webSupplement: publicationNeedsWeb && Boolean(webSearch),
      reason: publicationIntent ? (publicationNeedsWeb ? 'PUBLICATION_EVIDENCE_GAP_OR_LIVE_REQUEST' : 'PUBLICATION_EVIDENCE_FOUND') : 'GENERAL_QUERY'
    });
    if (publicationKnowledge.length > 0) {
      sendSSE('publication_knowledge', {
        count: publicationKnowledge.length,
        sources: publicationKnowledge.map(k => ({
          id: k.id, source: k.source, section: k.section, url: k.canonicalUrl, hash: k.hash
        }))
      });
    }
    if (publicationInventory.length > 0) sendSSE('publication_inventory', { sources: publicationInventory });
    
    // Contextual Search Resolver: Ensure web searches reflect user's intended meaning in context
    let contextualResolution: any = { resolved_query: question, search_required: false, ambiguity: false, context_used: [] };
    if (!isMetaInquiry && (allowWebRetrieval || (Array.isArray(history) && history.length > 0))) {
      contextualResolution = await resolveContextualSearchAsync(question || '', history || [], {
        // Context resolution is deterministic and provider-independent.
        // It is used only when a normal query actually needs contextual binding.
        searchEnabled: allowWebRetrieval
      });
      // News/current queries are explicit web intents; do not let a contextual
      // resolver suppress the live retrieval step.
      if (autoWebSearch && !contextualResolution.search_required && !contextualResolution.ambiguity) {
        contextualResolution = {
          ...contextualResolution,
          search_required: true,
          search_query: contextualResolution.search_query || question || '',
          resolved_query: contextualResolution.resolved_query || question || '',
        };
      }
      sendSSE('contextual_search_resolution', contextualResolution);
    }

    // Ambiguous follow-ups must not merge competing entities into a web query.
    // Keep the original message available for clarification and ordinary dialogue.
    const ambiguousContextualSearch = Boolean(contextualResolution.ambiguity);
    if (ambiguousContextualSearch) {
      sendSSE('contextual_search_ambiguity', {
        status: 'CLARIFICATION_REQUIRED',
        user_query: question,
        context_used: contextualResolution.context_used,