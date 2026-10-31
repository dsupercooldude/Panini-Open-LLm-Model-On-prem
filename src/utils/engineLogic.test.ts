import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HARDWARE_PROFILES,
  calculateQuantizedFootprint,
  calculateVideoTimingSchedule,
  getAutocompleteSuggestions,
  getDynamicTypingSuggestions,
  detectAmbiguousQueryContext,
  generateOfflineKnowledgeResponse,
  generateOfflineCodeSynthesis,
  generateDeepResearchPlan,
  executeDeepResearchPlan,
  streamMultiEngineOnlineSearch,
  analyzeNlpVisualPrompt,
  evaluateRbacPermission,
  applyVersionRollback,
  verifyExistingUseCaseMatch,
  generatePdfDocumentBytes,
  validateAndSelectOptimalModel,
  getCompatibleModelsForHardware,
  parsePromptIntoStoryboardShots,
  calculateModelMaturityAndSchedule,
  executeContinualLearningHarvest,
  generatePureLearningLedgerPdfBytes,
  applyPromptScenarioToModelLearning,
} from './engineLogic';
import {
  INITIAL_MODELS,
  INITIAL_CHAT_HISTORY,
  INITIAL_CHAT_THREADS,
  INITIAL_CUSTOM_SCENARIOS,
} from './initialData';
import {
  buildPromptConstructedScene,
  decomposePromptWithShardGrounding,
  analyzeBioscienceQuery,
  synthesizeMusicTrackSpec,
  generatePlayableWavDataUrl,
  synthesizeVeo3SynchronizedAudioSpec,
  applyImageEditInstruction,
  resolveMapsAndSearchGrounding,
  getPaniniKnowledgeShard,
  synthesizeCommercialReceiptSpec,
  formatReceiptForPdfExport,
  generatePureReceiptPdfBytes,
  formatReceiptCurrencyAmount,
  adaptMusicTrackToVisualBackground,
  detectMultilingualSpeechAndText,
} from './multimodalSuite';

test('Panini model registry honors Maharshi Panini and 400B quantized footprint fits in 16GB Mobile RAM using IQ1_S and MoE flash offload', () => {
  assert.ok(INITIAL_MODELS[0].name.startsWith('Panini-400B'));
  assert.ok(INITIAL_MODELS.every((m) => m.name.startsWith('Panini-')));

  const mobile = HARDWARE_PROFILES['mobile-arm64'];
  const footprint = calculateQuantizedFootprint(400, 37, 'IQ1_S', 8192, mobile);

  assert.equal(footprint.totalWeightsGb, 78);
  assert.equal(footprint.fitsInMemoryWithFlashOffload, true);
  assert.ok(footprint.activeResidentRamGb < mobile.ramGb);
  assert.ok(footprint.flashStreamedGb > 60);
});

test('Default workspace starts with zero query or output unless asked, Reference IDs on threads (including REF-1007), and zero pre-suggestions when input is empty', () => {
  assert.equal(INITIAL_CHAT_HISTORY.length, 0);
  assert.equal(INITIAL_CHAT_THREADS[0].messages.length, 0);
  assert.equal(INITIAL_CHAT_THREADS[0].workspaceMode, 'ask_math');
  assert.ok(INITIAL_CHAT_THREADS[0].referenceId.startsWith('REF-'));
  assert.ok(INITIAL_CHAT_THREADS.some((t) => t.referenceId === 'REF-1007'));

  // Strictly NO pre-suggestions when query is empty (never show suggestions on click/focus without typing)
  const emptyAutocomplete = getAutocompleteSuggestions('', ['Science', 'Computer Programming'], 6);
  assert.equal(emptyAutocomplete.length, 0);
  const emptyDynamic = getDynamicTypingSuggestions('', 'ask_math');
  assert.equal(emptyDynamic.length, 0);

  // Dynamic suggestions appear ONLY when typing
  const typedPaniniSuggestions = getDynamicTypingSuggestions('panini', 'ask_math');
  assert.ok(typedPaniniSuggestions.length >= 4);
  assert.ok(typedPaniniSuggestions.some((s) => s.label.includes('Maharshi Panini')));
  assert.ok(typedPaniniSuggestions.some((s) => s.label.includes('Italian Grilled Sandwich')));
  assert.ok(typedPaniniSuggestions.some((s) => s.label.includes('Panini 400B')));

  const generalResponse = generateOfflineKnowledgeResponse(
    'Design a distributed consensus protocol with sub-millisecond tail latency',
    undefined,
    'Q4_K_M',
    6,
    false
  );
  assert.notEqual(generalResponse.detectedDomain, 'Sacred & Religious Studies');
  assert.notEqual(generalResponse.detectedDomain, 'Astrology (Vedic, Tarot & Sidereal)');
});

test('Polysemous entity disambiguation detects ambiguous "Panini", "Mercury", and "Java" queries and resolves follow-up answers across multi-context turns', () => {
  const ambCheck = detectAmbiguousQueryContext('Tell me about Panini', undefined, 'ask_math');
  assert.equal(ambCheck.isAmbiguous, true);
  assert.equal(ambCheck.entityName, 'Panini');
  assert.ok(ambCheck.options && ambCheck.options.length === 4);

  // If user replies in natural language on the next turn ("the cheese sandwich"), it resolves to panini_culinary
  const pendingCtx = {
    resolvedEntity: 'Panini',
    resolvedSenseKey: '',
    resolvedSenseLabel: '',
    activeDomain: 'History' as const,
    activeSubDomain: 'Comparative',
    priorPrompts: ['Tell me about Panini'],
    keyFactsEstablished: [],
    pendingAmbiguityQuery: 'Tell me about Panini',
    pendingCapability: 'ask_math' as const,
  };
  const resolvedCulinary = detectAmbiguousQueryContext('I mean the cheese sandwich', pendingCtx, 'ask_math');
  assert.equal(resolvedCulinary.isAmbiguous, false);
  assert.equal(resolvedCulinary.resolvedFromPendingOption?.senseKey, 'panini_culinary');

  // Synthesize culinary panini response and verify multi-context follow-up inheritance
  const culinarySynthesis = generateOfflineKnowledgeResponse(
    resolvedCulinary.resolvedFromPendingOption!.resolvedPrompt,
    'History',
    'Q4_K_M',
    10,
    false,
    undefined,
    {
      resolvedSenseKey: 'panini_culinary',
      threadContext: {
        resolvedEntity: 'Panini (Italian Grilled Sandwich)',
        resolvedSenseKey: 'panini_culinary',
        resolvedSenseLabel: 'Panini (Italian Grilled Sandwich — Ciabatta, Melted Cheese & Culinary History)',
        activeDomain: 'History',
        activeSubDomain: 'Culinary History & Food Science',
        priorPrompts: ['Tell me about Panini'],
        keyFactsEstablished: [],
      },
    }
  );
  assert.ok(culinarySynthesis.answerMarkdown.includes('Ciabatta'));
  assert.ok(culinarySynthesis.answerMarkdown.includes('Mozzarella'));
  assert.ok(culinarySynthesis.answerMarkdown.includes('Maillard'));
  assert.ok(culinarySynthesis.followUpQuestions && culinarySynthesis.followUpQuestions.length === 3);

  // Follow-up turn without repeating the word "cheese" inherits the Maharshi Panini Rishi context when threadContext is set to panini_rishi
  const rishiFollowUp = generateOfflineKnowledgeResponse(
    'What were his major rules and how do the 14 sutras work?',
    undefined,
    'Q4_K_M',
    10,
    false,
    undefined,
    {
      threadContext: {
        resolvedEntity: 'Maharshi Panini',
        resolvedSenseKey: 'panini_rishi',
        resolvedSenseLabel: 'Maharshi Panini (Ancient Sanskrit Rishi & Ashtadhyayi Grammarian)',
        activeDomain: 'Literature',
        activeSubDomain: 'Classical Philology & Paninian Grammar',
        priorPrompts: ['Tell me about Maharshi Panini'],
        keyFactsEstablished: ['Authored Ashtadhyayi (3,959 sutras)'],
      },
    }
  );
  assert.ok(rishiFollowUp.answerMarkdown.includes('Ashtadhyayi'));
  assert.ok(rishiFollowUp.answerMarkdown.includes('Shiva Sutras'));
  assert.ok(rishiFollowUp.answerMarkdown.includes('Multi-Context Thread Memory Active'));
  assert.equal(
    rishiFollowUp.contextInheritedFrom,
    'Maharshi Panini (Ancient Sanskrit Rishi & Ashtadhyayi Grammarian)'
  );
});

test('Sacred & Religious Studies and Astrology use cases activate ONLY when explicitly asked about religious or astrological topics', () => {
  const sacredRes = generateOfflineKnowledgeResponse(
    'Compare Sanatan Vedas, Upanishads, Bhagavata Purana, Jainism Syadvada, Islamic Usul al-Fiqh, and Christian Patristics',
    undefined,
    'Q4_K_M',
    6,
    false
  );
  assert.equal(sacredRes.detectedDomain, 'Sacred & Religious Studies');
  assert.ok(sacredRes.answerMarkdown.includes('Sanatan Dharma'));
  assert.ok(sacredRes.answerMarkdown.includes('Jainism'));
  assert.ok(sacredRes.answerMarkdown.includes('Islam'));
  assert.ok(sacredRes.answerMarkdown.includes('Christianity'));

  const astroRes = generateOfflineKnowledgeResponse(
    'Synthesize Vedic Jyotish D9 Navamsha, Vimshottari Dasha, and Tarot Major Arcana archetypes',
    undefined,
    'Q4_K_M',
    6,
    false
  );
  assert.equal(astroRes.detectedDomain, 'Astrology (Vedic, Tarot & Sidereal)');
  assert.ok(astroRes.answerMarkdown.includes('Vedic Jyotish'));
  assert.ok(astroRes.answerMarkdown.includes('Tarot'));
});

test('Multi-Engine Online Search streams across 4 independent search engines with zero 3rd-party AI models referenced', () => {
  const stream = streamMultiEngineOnlineSearch(
    'Subduction zone eclogite seismic velocity inversion',
    'Geology'
  );
  assert.equal(stream.activeEnginesCount, 4);
  assert.equal(stream.engines.length, 4);
  assert.equal(stream.zeroThirdPartyAiModelsUsed, true);
  assert.ok(stream.engines.every((e) => e.matchedScenarioId.startsWith('SCN-')));
});

test('Deep Research generates tailored multi-stage plans for specific contexts and produces detailed stage matrix, valid HTTPS bibliography links, and model tuning', () => {
  const rishiPlan = generateDeepResearchPlan('Maharshi Panini Ashtadhyayi sutras');
  assert.equal(rishiPlan.length, 4);
  assert.ok(rishiPlan[0].title.includes('Gandhara Shalatura'));
  assert.ok(rishiPlan[1].title.includes('Shiva Sutras'));
  assert.ok(
    rishiPlan.every((s) =>
      Boolean(s.thresholdSummary && s.belowThresholdBehavior && s.aboveThresholdBehavior && s.realWorldExample)
    )
  );

  const culinaryPlan = generateDeepResearchPlan('Italian Panini sandwich cheese and ciabatta');
  assert.equal(culinaryPlan.length, 4);
  assert.ok(culinaryPlan[1].title.includes('Cheese Melt (58°C–68°C)'));
  assert.ok(!culinaryPlan[1].title.includes('Rheology'));
  assert.ok(
    culinaryPlan.every((s) =>
      Boolean(s.thresholdSummary && s.belowThresholdBehavior && s.aboveThresholdBehavior && s.realWorldExample)
    )
  );

  // Verify non-math / non-cyber Deep Research strictly enforces plain-English thresholds and excludes unrelated math/cyber jargon
  const everydayPlan = generateDeepResearchPlan('Thresholds and tipping points in everyday life and water boiling');
  const everydayReport = executeDeepResearchPlan(
    'Thresholds and tipping points in everyday life and water boiling',
    everydayPlan,
    true,
    'Q4_K_M',
    10
  );
  assert.ok(everydayReport.answerMarkdown.includes('Plain-English Threshold Breakdown for Stage 1:'));
  assert.ok(everydayReport.answerMarkdown.includes('Plain-English Threshold Breakdown for Stage 2:'));
  assert.ok(everydayReport.answerMarkdown.includes('Plain-English Threshold Breakdown for Stage 3:'));
  assert.ok(everydayReport.answerMarkdown.includes('Plain-English Threshold Breakdown for Stage 4:'));
  assert.ok(!everydayReport.answerMarkdown.includes('T_crit'));
  assert.ok(!everydayReport.answerMarkdown.includes('T_min'));
  assert.ok(!everydayReport.answerMarkdown.includes('Hamiltonian'));
  assert.ok(!everydayReport.answerMarkdown.includes('Lindblad'));
  assert.ok(!everydayReport.answerMarkdown.includes('Cybersecurity'));
  assert.ok(!everydayReport.answerMarkdown.includes('Kyber'));
  assert.ok(!everydayReport.deepResearchTuning?.qloraAdapterRank.includes('QLoRA'));
  assert.ok(!everydayReport.glassBox.kvCacheCompressionRatio.includes('FP8 KV'));
  assert.ok(
    everydayReport.multiEngineStream?.engines.every(
      (eng) => !eng.streamedSnippet.includes('Hamiltonian') && !eng.engineName.includes('RFC')
    )
  );

  const plan = generateDeepResearchPlan('Post-Quantum Kyber-1024 Hybrid TLS Architecture');
  assert.equal(plan.length, 4);
  plan[1].title = 'Custom User-Edited Cryptographic Lattice Bound Analysis';
  plan[1].objective = 'Evaluate custom hardware lattice NTT throughput and memory bounds.';

  const report = executeDeepResearchPlan(
    'Post-Quantum Kyber-1024 Hybrid TLS Architecture',
    plan,
    true,
    'Q4_K_M',
    42,
    {
      isOnlineInternetFetched: true,
      references: [
        {
          refNumber: 1,
          title: 'Kyber (Wikipedia Live Reference)',
          authorsOrInstitution: 'Wikipedia Live Encyclopedia API',
          publicationOrSource: 'Wikipedia Live Encyclopedia API (Online Retrieved)',
          year: 2026,
          doiOrUrl: 'https://en.wikipedia.org/wiki/Kyber',
          crawlerEngine: 'Live Wikipedia REST API',
          relevanceSummary: 'Kyber is a key encapsulation mechanism designed to be resistant to cryptanalytic attacks with future quantum computers.',
        },
        {
          refNumber: 2,
          title: 'CRYSTALS-Kyber Lattice Cryptography Specification',
          authorsOrInstitution: 'NIST Post-Quantum Cryptography Standardization',
          publicationOrSource: 'OpenAlex Live Scholarly Index',
          year: 2026,
          doiOrUrl: 'https://openalex.org/works?search=Kyber',
          crawlerEngine: 'Live OpenAlex API',
          relevanceSummary: 'Standardizes Module-LWE key encapsulation for TLS 1.3.',
        },
        {
          refNumber: 3,
          title: 'Hardware NTT Accelerators for Lattice KEMs',
          authorsOrInstitution: 'IEEE Cryptographic Hardware Consortium',
          publicationOrSource: 'IEEE Transactions',
          year: 2026,
          doiOrUrl: 'https://arxiv.org/search/?query=Kyber',
          crawlerEngine: 'Backend Preprint Index',
          relevanceSummary: 'Evaluates sub-millisecond hardware NTT bounds.',
        },
        {
          refNumber: 4,
          title: 'Hybrid TLS 1.3 Post-Quantum Handshake Telemetry',
          authorsOrInstitution: 'IETF TLS Working Group',
          publicationOrSource: 'Crossref DOI Registry',
          year: 2026,
          doiOrUrl: 'https://search.crossref.org/?q=Kyber',
          crawlerEngine: 'Backend DOI Resolver',
          relevanceSummary: 'Empirical packet size and handshake latency benchmarks.',
        },
      ],
      liveStageSnippets: {
        [plan[1].id]: 'Live stage finding: Hardware NTT acceleration reduces Kyber-1024 latency to 14 microseconds.',
      },
    }
  );

  assert.ok(report.answerMarkdown.includes('Custom User-Edited Cryptographic Lattice Bound Analysis'));
  assert.ok(report.answerMarkdown.includes('Evaluate custom hardware lattice NTT throughput and memory bounds.'));
  assert.ok(report.answerMarkdown.includes('Live stage finding: Hardware NTT acceleration reduces Kyber-1024 latency'));
  assert.ok(report.answerMarkdown.includes('Executive Summary & Multi-Stage Synthesis Matrix'));
  assert.ok(report.answerMarkdown.includes('Verified Bibliography & Primary References'));
  assert.ok(!report.answerMarkdown.includes('Web Crawler Engine'));
  assert.ok(report.bibliographyReferences && report.bibliographyReferences.length >= 4);
  assert.ok(report.bibliographyReferences.some((ref) => ref.doiOrUrl === 'https://en.wikipedia.org/wiki/Kyber'));
  assert.ok(report.bibliographyReferences.every((ref) => ref.doiOrUrl.startsWith('https://')));

  assert.ok(report.deepResearchTuning);
  assert.ok(report.deepResearchTuning.useCaseScenarioId.startsWith('SCN-'));
  assert.ok(report.deepResearchTuning.trainingTriplesExtracted >= 16);

  const pdfBytes = generatePdfDocumentBytes(
    'Deep Research Report',
    'Post-Quantum Kyber-1024 Hybrid TLS Architecture',
    report.answerMarkdown,
    report.detectedDomain,
    report.glassBox.explainableAi,
    report.bibliographyReferences
  );
  const pdfString = new TextDecoder().decode(pdfBytes);
  assert.ok(pdfString.startsWith('%PDF-1.4'));
  assert.ok(pdfString.includes('BIBLIOGRAPHY'));
});

test('Coding synthesis runs pre-generation bug checks, static verification, and produces live output preview', () => {
  const explicitRust = generateOfflineCodeSynthesis(
    'Build a lock-free telemetry ring buffer',
    'Rust',
    'Q4_K_M',
    false
  );
  assert.equal(explicitRust.resolvedLanguage, 'Rust');
  assert.equal(explicitRust.usedBestPracticeFallback, false);
  assert.ok(explicitRust.answerMarkdown.includes('```rust'));
  assert.ok(explicitRust.codingResolution?.bugChecks && explicitRust.codingResolution.bugChecks.length >= 3);
  assert.ok(explicitRust.codingResolution?.executionPreviewOutput?.includes('0 bugs detected'));
});

test('Use-case verification detects existing fulfillment or close match for Clone & Edit workflow', () => {
  const matchRes = verifyExistingUseCaseMatch(
    'Design post-quantum Kyber-1024 hybrid TLS 1.3 handshake with eBPF sandboxing',
    INITIAL_CUSTOM_SCENARIOS
  );
  assert.equal(matchRes.hasExactOrCloseMatch, true);
  assert.ok(matchRes.matches.length > 0);
  assert.ok(matchRes.matches[0].similarityScorePct >= 45);
});

test('Model validation auto-routes smaller models to Panini-400B-MoE-Flagship for 8K Cinema Studio and Deep Research', () => {
  const compatible = getCompatibleModelsForHardware(INITIAL_MODELS, HARDWARE_PROFILES['desktop-workstation']);
  const smallModel = INITIAL_MODELS[2]; // 8B Edge model
  const validation = validateAndSelectOptimalModel('video_gen', compatible, smallModel);
  assert.equal(validation.autoSwitched, true);
  assert.equal(validation.selectedModel.id, INITIAL_MODELS[0].id);
  assert.ok(validation.validationReason.includes('Validated Video tensor pipeline'));
});

test('8K Cinema Studio routes culinary panini prompts to culinary_studio, Maharshi Panini gurukul prompts to ancient_gurukul, and Studio Ghibli prompts to ghibli_meadow', () => {
  const culinaryScene = analyzeNlpVisualPrompt(
    'Artisanal Italian panini with melted mozzarella and basil pesto on a cast-iron grill in a culinary kitchen',
    '8K Master'
  );
  assert.equal(culinaryScene.sceneEnvironment, 'culinary_studio');
  assert.equal(culinaryScene.humanAction, 'cooking');
  assert.ok(culinaryScene.detectedObjects?.includes('grilled_panini'));
  assert.ok(culinaryScene.detectedObjects?.includes('melted_cheese'));

  const gurukulScene = analyzeNlpVisualPrompt(
    'Ancient Takshashila gurukul courtyard where Maharshi Panini teaches Sanskrit Ashtadhyayi sutras on palm-leaf manuscripts',
    '8K Master'
  );
  assert.equal(gurukulScene.sceneEnvironment, 'ancient_gurukul');
  assert.equal(gurukulScene.humanAction, 'teaching_sutras');
  assert.ok(gurukulScene.detectedObjects?.includes('palm_leaf_manuscripts'));

  const ghibliScene = analyzeNlpVisualPrompt(
    'Studio Ghibli Geebly hand-painted watercolor meadow with a steam train, dragon spirit, and floating sakura petals in golden sunset',
    '8K Master',
    'Studio Ghibli (Geebly) Hand-Painted World',
    'Anamorphic Three-Point Rim & Volumetric God-Rays',
    '65mm IMAX Anamorphic 2.39:1 Dolly'
  );
  assert.ok(ghibliScene.pixelDimensions.includes('7680'));
  assert.equal(ghibliScene.creativeTheme, 'Studio Ghibli (Geebly) Hand-Painted World');
  assert.ok(ghibliScene.detectedObjects?.includes('train'));
  assert.ok(ghibliScene.detectedObjects?.includes('creature'));
  assert.equal(ghibliScene.weatherEffect, 'petals');
  assert.ok(ghibliScene.dataValidationStatus?.includes('VALIDATED'));

  const video8k = calculateVideoTimingSchedule(4, 24, '8K Master', 32, 0, 'desktop-workstation');
  assert.equal(video8k.totalFrames, 96);

  assert.equal(evaluateRbacPermission('Admin', 'manage_rbac_and_auth'), true);
  const rolledBack = applyVersionRollback(
    INITIAL_MODELS[0],
    INITIAL_MODELS[0].versions[1].versionId,
    'Dr. Elena Rostova'
  );
  assert.equal(rolledBack.versions[0].isRollbackCommit, true);
});

test('Biographical and historical entity queries like "Tell me about Mahatma Gandhi" route to History, select the right Sub-Domain Expert & Pretrained Scenario, synthesize accurate biography, and produce a learnedEntity record for model weight tuning', () => {
  const gandhiRes = generateOfflineKnowledgeResponse(
    'Tell me about Mahatma Gandhi',
    undefined,
    'Q4_K_M',
    12,
    false,
    undefined,
    {
      safetyMode: 'Safe Mode',
      selectedExpertId: 'auto',
      customScenarios: INITIAL_CUSTOM_SCENARIOS,
    }
  );

  assert.equal(gandhiRes.detectedDomain, 'History');
  assert.equal(gandhiRes.subDomain, 'Modern Political & Anti-Colonial History');
  assert.ok(gandhiRes.selectedExpert);
  assert.equal(gandhiRes.selectedExpert.name, 'Dr. Aravind Deshmukh');
  assert.ok(gandhiRes.contrastingOpinions && gandhiRes.contrastingOpinions.length >= 1);
  assert.ok(gandhiRes.matchedScenario);
  assert.equal(gandhiRes.matchedScenario.domain, 'History');

  // Verify rich biographical content and absence of unrelated physics formulas
  assert.ok(gandhiRes.answerMarkdown.includes('Mohandas Karamchand Gandhi'));
  assert.ok(gandhiRes.answerMarkdown.includes('Satyagraha'));
  assert.ok(gandhiRes.answerMarkdown.includes('Dandi Salt March'));
  assert.ok(gandhiRes.answerMarkdown.includes('Quit India Movement'));
  assert.ok(!gandhiRes.answerMarkdown.includes('Hamiltonian'));

  // Verify learnedEntity is emitted to update pretrained model weights
  assert.ok(gandhiRes.learnedEntity);
  assert.ok(gandhiRes.learnedEntity.entityTitle.includes('Mahatma Gandhi'));
});

test('News channel presenter video prompt selects news_studio environment, presenting_news human action, and broadcast_desk object', () => {
  const newsVisual = analyzeNlpVisualPrompt(
    'Generate a video for presenter of news channel',
    '8K Master',
    'Golden-Hour Nature Documentary',
    'Golden-Hour Chiaroscuro & Subsurface Glow',
    '65mm IMAX Anamorphic 2.39:1 Dolly'
  );

  assert.equal(newsVisual.sceneEnvironment, 'news_studio');
  assert.equal(newsVisual.hasHumanSubject, true);
  assert.equal(newsVisual.humanAction, 'presenting_news');
  assert.ok(newsVisual.detectedObjects?.includes('broadcast_desk'));
});

test('Content Safety Guardrail modes (Safe Mode, Child Mode, NSFW Mode) and manual Sub-Domain Expert override behave deterministically', () => {
  const childRes = generateOfflineKnowledgeResponse(
    'Tell me about Mahatma Gandhi',
    undefined,
    'Q4_K_M',
    12,
    false,
    undefined,
    {
      safetyMode: 'Child Mode',
      selectedExpertId: 'exp-hist-world-biography',
      customScenarios: INITIAL_CUSTOM_SCENARIOS,
    }
  );

  assert.equal(childRes.safetyModeApplied, 'Child Mode');
  assert.ok(childRes.answerMarkdown.includes('Child Mode Active'));
  assert.equal(childRes.selectedExpert?.id, 'exp-hist-world-biography');
  assert.equal(childRes.selectedExpert?.name, 'Dr. Marcus Vance');
  assert.ok(childRes.simpleAnswerMarkdown && childRes.simpleAnswerMarkdown.includes('Simple View'));
});

test('Multi-shot Storyboard parser splits multi-sentence prompts into dynamic shot-by-shot animations and Deep Research stays 100% on-topic with plain-English threshold explanations', () => {
  const visualDandi = analyzeNlpVisualPrompt(
    'Mahatma Gandhi leads the peaceful Dandi Salt March along the golden ocean coast at sunrise. Hundreds of villagers walk together in white khadi cloth beside shimmering sea waves. At the shoreline, he lifts a handful of natural sea salt into the warm morning sunlight.',
    '8K Master'
  );
  assert.ok(visualDandi.storyboardShots && visualDandi.storyboardShots.length === 3);
  assert.equal(visualDandi.storyboardShots[0].shotNumber, 1);
  assert.equal(visualDandi.storyboardShots[1].shotNumber, 2);
  assert.equal(visualDandi.storyboardShots[2].shotNumber, 3);
  assert.ok(visualDandi.storyboardShots[0].sentence.includes('Dandi Salt March'));

  // Verify Deep Research on thresholds does NOT drift into Cybersecurity or Mathematics unless requested
  const thresholdPlan = generateDeepResearchPlan(
    'Explain what a threshold is and how critical thresholds and tipping points work in everyday life, medicine, climate, and engineering'
  );
  assert.equal(thresholdPlan.length, 4);
  assert.ok(
    thresholdPlan.every(
      (stg) => stg.domainFocus !== 'Cybersecurity' && stg.domainFocus !== 'Mathematics'
    )
  );
  assert.ok(thresholdPlan[0].title.includes('Plain-English Definition'));

  const thresholdReport = executeDeepResearchPlan(
    'Explain what a threshold is and how critical thresholds and tipping points work in everyday life, medicine, climate, and engineering',
    thresholdPlan,
    false,
    'Q4_K_M',
    18
  );
  assert.ok(thresholdReport.simpleAnswerMarkdown);
  assert.ok(thresholdReport.simpleAnswerMarkdown.includes('Below the Threshold'));
  assert.ok(thresholdReport.simpleAnswerMarkdown.includes('Above the Threshold'));
  assert.ok(thresholdReport.answerMarkdown.includes('Plain-English Concept & Threshold Guide'));

  // Verify REF-1001, REF-1005, and REF-1006 exist and include simpleAnswerMarkdown
  const ref1001 = INITIAL_CHAT_THREADS.find((t) => t.referenceId === 'REF-1001');
  const ref1005 = INITIAL_CHAT_THREADS.find((t) => t.referenceId === 'REF-1005');
  const ref1006 = INITIAL_CHAT_THREADS.find((t) => t.referenceId === 'REF-1006');
  assert.ok(ref1001 && ref1001.messages[1].simpleAnswerMarkdown);
  assert.ok(ref1005 && ref1005.messages[1].simpleAnswerMarkdown);
  assert.ok(ref1005.messages[1].generatedMedia?.visualNlp?.storyboardShots?.length === 3);
  assert.ok(ref1006 && ref1006.messages[1].simpleAnswerMarkdown);
});

test('Unified Panini Offline-First Shard Suite: 3D Bioscience, Multi-Stem Audio Synth, Vision Studio, Spatial Atlas, and 100% Prompt-Constructed 16:9 / 9:16 Video Scenes', () => {
  // 1. Prompt-Constructed Scene Builder (Zero static mountain/observatory fallback)
  const culinaryScene16x9 = buildPromptConstructedScene(
    'Artisan Italian panini sizzling on a cast-iron grill press with melted mozzarella and fresh green basil',
    '16:9'
  );
  assert.equal(culinaryScene16x9.horizonType, 'culinary_counter');
  assert.equal(culinaryScene16x9.aspectRatio, '16:9');
  assert.ok(culinaryScene16x9.actors.some((a) => a.kind === 'culinary_dish'));

  const cyberScene9x16 = buildPromptConstructedScene(
    'Crimson cyberpunk bullet train gliding through neon rain in Tokyo at night',
    '9:16'
  );
  assert.equal(cyberScene9x16.horizonType, 'urban_street');
  assert.equal(cyberScene9x16.aspectRatio, '9:16');
  assert.ok(cyberScene9x16.actors.some((a) => a.kind === 'vehicle_vessel'));

  // 2. Bioscience 3D Molecular Viewer & AlphaFold / ClinVar / ChEMBL Suite
  const bio = analyzeBioscienceQuery(
    'Analyze BRCA1 protein 3D structure with AlphaFold pLDDT confidence, ClinVar variants, and ChEMBL Lipinski metrics'
  );
  assert.equal(bio.geneSymbol, 'BRCA1');
  assert.equal(bio.uniprotAccession, 'P38398');
  assert.ok(bio.atoms.length >= 60);
  assert.ok(bio.meanPlddtScore > 80);
  assert.ok(bio.variants.length >= 2);
  assert.equal(bio.drugProfile.lipinskiCompliant, true);
  assert.equal(bio.ExecutionSource, 'Panini Offline Bioscience Shard');

  // Verify bioscience shard was persisted into Panini Offline Knowledge Shard Vault
  const cachedBioShard = getPaniniKnowledgeShard(
    'Analyze BRCA1 protein 3D structure with AlphaFold pLDDT confidence, ClinVar variants, and ChEMBL Lipinski metrics'
  );
  assert.ok(cachedBioShard?.bioscience);
  assert.equal(cachedBioShard?.bioscience?.geneSymbol, 'BRCA1');

  // 3. Panini Multi-Stem Audio Generation (30s Clip vs Full Track 120s + playable WAV data URL)
  const clipTrack = synthesizeMusicTrackSpec(
    'Compose an electronic synthwave track with warm analog pads',
    '30s_clip',
    true
  );
  assert.equal(clipTrack.modelUsed, 'Panini-Audio-Clip (30s)');
  assert.equal(clipTrack.durationSec, 30);
  assert.equal(clipTrack.stems.length, 4);
  const wavUrl = generatePlayableWavDataUrl(clipTrack.stems[0].patternNotesHz, clipTrack.bpm, 2);
  assert.ok(wavUrl.startsWith('data:audio/wav;base64,'));

  const proTrack = synthesizeMusicTrackSpec(
    'Compose a full orchestral film score',
    'full_track',
    false
  );
  assert.equal(proTrack.modelUsed, 'Panini-Audio-Pro (2:00)');
  assert.equal(proTrack.durationSec, 120);

  // 4. Panini Vision Studio (Panini-Vision-Studio-8K)
  const baseImageSpec = {
    id: 'img-test-1',
    prompt: 'A golden sunset over a calm ocean bay with a sailboat',
    modelUsed: 'Panini-Vision-Studio-8K' as const,
    resolution: '3840x2160 (4K)' as const,
    aspectRatio: '16:9' as const,
    editHistory: [],
    sceneElements: buildPromptConstructedScene(
      'A golden sunset over a calm ocean bay with a sailboat',
      '16:9'
    ),
  };
  const editedImageSpec = applyImageEditInstruction(
    baseImageSpec,
    'Add dramatic storm clouds and neon cyber reflections',
    {
      inpaintRegion: 'Sky & Atmosphere',
      typographyOverlayText: 'PANINI 4K CINEMA',
      openSourceArchitecture: 'Panini-Flux.1-Dev-12B (Rectified Flow DiT)',
    }
  );
  assert.equal(editedImageSpec.editHistory.length, 1);
  assert.equal(editedImageSpec.editHistory[0].styleOverlay, 'cyberpunk');
  assert.equal(editedImageSpec.inpaintRegion, 'Sky & Atmosphere');
  assert.equal(editedImageSpec.typographyOverlayText, 'PANINI 4K CINEMA');
  assert.equal(
    editedImageSpec.openSourceArchitecture,
    'Panini-Flux.1-Dev-12B (Rectified Flow DiT)'
  );

  // Verify Veo-3 Open-Source Video DiT + Synchronized Foley Audio Spec
  const culinaryVideoScene = buildPromptConstructedScene(
    'Artisan Italian panini sizzling on a cast-iron grill press with melted mozzarella',
    '16:9'
  );
  assert.ok(culinaryVideoScene.veo3AudioSpec);
  assert.ok(culinaryVideoScene.veo3AudioSpec?.wavDataUrl.startsWith('data:audio/wav;base64,'));
  assert.equal(
    culinaryVideoScene.openSourceVideoModel,
    'Panini-Wan2.1-14B (3D Spatio-Temporal DiT)'
  );
  assert.ok(culinaryVideoScene.cameraTrajectory);

  // 5. Panini Spatial Atlas & Verified Index Grounding + Offline Shard Reuse
  const grounding = resolveMapsAndSearchGrounding(
    'Map the coordinates and nearby landmarks of Taxila and ancient Gandhara'
  );
  assert.equal(grounding.mapsGrounding.modelUsed, 'Panini-Spatial-Atlas');
  assert.equal(grounding.searchGrounding.modelUsed, 'Panini-Verified-Index');
  assert.ok(grounding.mapsGrounding.centerLat > 33 && grounding.mapsGrounding.centerLng > 72);
  assert.ok(grounding.mapsGrounding.places.length >= 2);
  assert.ok(grounding.searchGrounding.citations.length >= 2);
  assert.ok(grounding.ggufShardFile.endsWith('.gguf'));
  assert.ok(grounding.binTensorFile.endsWith('.bin'));
});

test('Local GGUF/BIN shard caching in generateOfflineKnowledgeResponse persists online search/Wikipedia/Maps groundings for single-source-of-truth offline replay and validates Bullet Train articulation', () => {
  const query = 'Shinkansen L0 Series Maglev aerodynamic viaduct engineering in Tokyo';
  const onlineRes = generateOfflineKnowledgeResponse(
    query,
    'Science',
    'Q4_K_M',
    14,
    true,
    [
      {
        title: 'Shinkansen High-Speed Railway Viaduct Specification',
        authorsOrInstitution: 'Wikipedia Live Encyclopedia API',
        publicationOrSource: 'Wikipedia Live Encyclopedia API',
        year: 2026,
        snippet: 'Shinkansen bullet trains operate on dedicated elevated concrete viaducts with 25 kV AC overhead catenary power and 15-meter aerodynamic nose cones to mitigate tunnel boom.',
        url: 'https://en.wikipedia.org/wiki/Shinkansen',
      },
    ]
  );

  assert.ok(onlineRes.ggufShardFile && onlineRes.ggufShardFile.endsWith('.gguf'));
  assert.ok(onlineRes.binTensorFile && onlineRes.binTensorFile.endsWith('.bin'));
  assert.ok(onlineRes.answerMarkdown.includes('Local GGUF/BIN Knowledge Shard Grounding'));
  assert.ok(onlineRes.answerMarkdown.includes(onlineRes.ggufShardFile!));

  // Subsequent offline call with zero liveOnlineSources reads directly from the cached local .gguf / .bin shard
  const offlineReplay = generateOfflineKnowledgeResponse(
    query,
    'Science',
    'Q4_K_M',
    14,
    false,
    undefined
  );
  assert.equal(offlineReplay.ggufShardFile, onlineRes.ggufShardFile);
  assert.equal(offlineReplay.binTensorFile, onlineRes.binTensorFile);
  assert.ok(offlineReplay.answerMarkdown.includes('Shinkansen High-Speed Railway Viaduct Specification'));
  assert.ok(offlineReplay.answerMarkdown.includes(onlineRes.ggufShardFile!));

  // Verify Bullet Train contextual articulation & validation report
  const bulletTrainScene = buildPromptConstructedScene(
    'Generate an image and video of a high-speed Bullet train gliding across an elevated viaduct',
    '16:9'
  );
  assert.equal(bulletTrainScene.primarySubjectArchetype, 'bullet_train');
  assert.ok(bulletTrainScene.validationReport);
  assert.equal(bulletTrainScene.validationReport.isValidated, true);
  assert.equal(
    bulletTrainScene.validationReport.contextSubjectLabel,
    'High-Speed Aerodynamic Bullet Train (Shinkansen / Maglev Viaduct)'
  );
  assert.equal(bulletTrainScene.validationReport.articulatedElements.length, 4);
  assert.ok(bulletTrainScene.validationReport.ggufShardFile.endsWith('.gguf'));
});

test('Veo3 / Nano-Banana PBR lighting pass, storyboard shot-synchronized foley audio, and accurate contextual depiction for Man in Shower, Laser Hair Removal Machine, and Industrial Machinery', () => {
  // 1. Man in shower (Shot 1)
  const showerScene = buildPromptConstructedScene(
    'A man in a luxury shower under cascading warm rainfall water and volumetric steam',
    '16:9',
    undefined,
    1
  );
  assert.equal(showerScene.primarySubjectArchetype, 'human_shower');
  assert.equal(showerScene.horizonType, 'indoor_studio_floor');
  assert.equal(showerScene.veo3AudioSpec?.foleyMode, 'water_shower');
  assert.ok(showerScene.veo3AudioSpec?.foleyDescription.includes('[Shot 1 Sync]'));
  assert.ok(showerScene.veo3AudioSpec?.wavDataUrl.startsWith('data:audio/wav;base64,'));
  assert.equal(showerScene.pbrLightingPass?.architecturePattern, 'Veo3-NanoBanana-Hybrid-PBR-8K');
  assert.ok(showerScene.pbrLightingPass?.subsurfaceScattering.includes('Epidermal'));
  assert.equal(showerScene.validationReport?.isValidated, true);
  assert.ok(showerScene.validationReport?.contextSubjectLabel.includes('Human Subject in Luxury Rainfall Shower'));

  // 2. Laser hair removal machine (Shot 2)
  const laserScene = buildPromptConstructedScene(
    'Clinical diode laser hair removal machine with sapphire cooling handpiece and touchscreen console',
    '16:9',
    undefined,
    2
  );
  assert.equal(laserScene.primarySubjectArchetype, 'laser_hair_removal_machine');
  assert.equal(laserScene.horizonType, 'indoor_studio_floor');
  assert.equal(laserScene.veo3AudioSpec?.foleyMode, 'laser_medical');
  assert.ok(laserScene.veo3AudioSpec?.foleyDescription.includes('[Shot 2 Sync]'));
  assert.equal(laserScene.pbrLightingPass?.architecturePattern, 'Veo3-NanoBanana-Hybrid-PBR-8K');
  assert.equal(laserScene.validationReport?.isValidated, true);
  assert.ok(laserScene.validationReport?.contextSubjectLabel.includes('Clinical Aesthetic Diode Laser Hair Removal Machine'));

  // 3. Industrial machinery (Shot 3)
  const machineryScene = buildPromptConstructedScene(
    'Heavy-duty 6-axis CNC industrial machinery milling an aerospace titanium block with hydraulic pistons and sparks',
    '16:9',
    undefined,
    3
  );
  assert.equal(machineryScene.primarySubjectArchetype, 'industrial_machinery');
  assert.equal(machineryScene.horizonType, 'indoor_studio_floor');
  assert.equal(machineryScene.veo3AudioSpec?.foleyMode, 'heavy_machinery');
  assert.ok(machineryScene.veo3AudioSpec?.foleyDescription.includes('[Shot 3 Sync]'));
  assert.equal(machineryScene.pbrLightingPass?.architecturePattern, 'Veo3-NanoBanana-Hybrid-PBR-8K');
  assert.equal(machineryScene.validationReport?.isValidated, true);
  assert.ok(machineryScene.validationReport?.contextSubjectLabel.includes('Precision Multi-Axis Industrial CNC & Hydraulic Machinery System'));
});

test('Universal Procedural 3D Scene Builder: Sikh Turban, Hindu Saffron Dhoti & Saree, Male vs Female Hair Dimorphism, Brand Logo Emblems, Banking & Retail Scenarios, and Camera Framing', () => {
  // 1. Sikh gentleman with pleated turban (Dastar) in a Banking & Financial advisory floor
  const sikhBankScene = buildPromptConstructedScene(
    'A Sikh financial advisor wearing a crimson turban at a wealth management bank desk reviewing portfolio charts',
    '16:9'
  );
  assert.equal(sikhBankScene.primarySubjectArchetype, 'banking_financial_scene');
  assert.ok(sikhBankScene.promptDecomposition);
  assert.equal(sikhBankScene.promptDecomposition.scenarioDomain, 'banking_finance');
  assert.equal(sikhBankScene.promptDecomposition.humanAnatomy.religiousCulturalTradition, 'sikh');
  assert.equal(sikhBankScene.promptDecomposition.humanAnatomy.headwear, 'sikh_turban_dastar');
  assert.equal(sikhBankScene.promptDecomposition.humanAnatomy.hairStructure, 'turban_covered');
  assert.equal(sikhBankScene.promptDecomposition.humanAnatomy.facialHair, 'full_beard');
  assert.equal(sikhBankScene.validationReport?.isValidated, true);

  // 2. Hindu person wearing saffron dhoti & sacred tilak
  const hinduDhotiScene = buildPromptConstructedScene(
    'A Hindu scholar wearing saffron dhoti and kurta with sacred tilak on forehead',
    '16:9'
  );
  assert.ok(hinduDhotiScene.promptDecomposition);
  assert.equal(hinduDhotiScene.promptDecomposition.humanAnatomy.religiousCulturalTradition, 'hindu');
  assert.equal(hinduDhotiScene.promptDecomposition.humanAnatomy.wardrobeStyle, 'saffron_dhoti_kurta');
  assert.equal(hinduDhotiScene.promptDecomposition.humanAnatomy.foreheadAdornment, 'tilak_tripundra');
  assert.equal(hinduDhotiScene.promptDecomposition.humanAnatomy.wardrobePrimaryHex, '#f97316');

  // 3. Woman with braided hair in a Retail store POS checkout scenario + Close-Up Face override
  const womanRetailScene = buildPromptConstructedScene(
    'A smiling woman with braided hair working at a retail store checkout counter scanning shopping bags',
    '16:9',
    undefined,
    1,
    { cameraFraming: 'closeup_portrait' }
  );
  assert.equal(womanRetailScene.primarySubjectArchetype, 'retail_store_scene');
  assert.ok(womanRetailScene.promptDecomposition);
  assert.equal(womanRetailScene.promptDecomposition.scenarioDomain, 'retail_store');
  assert.equal(womanRetailScene.promptDecomposition.humanAnatomy.gender, 'female');
  assert.equal(womanRetailScene.promptDecomposition.humanAnatomy.hairStructure, 'braided');
  assert.equal(womanRetailScene.promptDecomposition.humanAnatomy.cameraFraming, 'closeup_portrait');

  // 4. Brand & Logo Emblem detection (Ferrari, Apple iPhone, Nike)
  const ferrariScene = buildPromptConstructedScene(
    'A crimson Ferrari supercar speeding along a coastal highway at sunset',
    '16:9'
  );
  assert.equal(ferrariScene.primarySubjectArchetype, 'sports_vehicle');
  assert.equal(ferrariScene.promptDecomposition?.brandSpec.brandName, 'Ferrari');
  assert.equal(ferrariScene.promptDecomposition?.brandSpec.logoEmblemKind, 'prancing_horse_shield');

  const appleDecomp = decomposePromptWithShardGrounding(
    'Close-up product showcase of a titanium Apple iPhone Pro on a studio pedestal'
  );
  assert.equal(appleDecomp.brandSpec.brandName, 'Apple');
  assert.equal(appleDecomp.brandSpec.logoEmblemKind, 'apple_bitten');

  const nikeScene = buildPromptConstructedScene(
    'Nike athletic running sneaker showcase with orange swoosh logo',
    '16:9'
  );
  assert.equal(nikeScene.primarySubjectArchetype, 'branded_product_showcase');
  assert.equal(nikeScene.promptDecomposition?.brandSpec.brandName, 'Nike');
  assert.equal(nikeScene.promptDecomposition?.brandSpec.logoEmblemKind, 'swoosh_vector');

  // 5. Multi-Dish Culinary Platter (Saffron Biryani & Ramen Bowl)
  const biryaniScene = buildPromptConstructedScene(
    'Fragrant royal saffron biryani served in a brass handi with aromatic steam',
    '16:9'
  );
  assert.equal(biryaniScene.primarySubjectArchetype, 'culinary_dish_platter');
  assert.equal(biryaniScene.promptDecomposition?.culinarySpec.dishType, 'biryani_handi');
});

test('Man in Nike shoes, Architectural Places/Buildings, and Strict Zero-Default-Fallback Gate', () => {
  // 1. "Man in Nike shoes" composite: Full-body human + Nike Swoosh footwear
  const manInNikeScene = buildPromptConstructedScene('Man in Nike shoes', '16:9');
  assert.equal(manInNikeScene.validationReport.isValidated, true);
  assert.equal(manInNikeScene.primarySubjectArchetype, 'human_portrait_character');
  assert.equal(manInNikeScene.promptDecomposition.humanAnatomy.hasHumanSubject, true);
  assert.equal(manInNikeScene.promptDecomposition.humanAnatomy.gender, 'male');
  assert.equal(manInNikeScene.promptDecomposition.humanAnatomy.cameraFraming, 'full_body');
  assert.equal(manInNikeScene.promptDecomposition.humanAnatomy.wardrobeStyle, 'athletic');
  assert.equal(manInNikeScene.promptDecomposition.brandSpec.isBranded, true);
  assert.equal(manInNikeScene.promptDecomposition.brandSpec.brandName, 'Nike');
  assert.equal(manInNikeScene.promptDecomposition.brandSpec.logoEmblemKind, 'swoosh_vector');
  assert.equal(manInNikeScene.promptDecomposition.brandSpec.productFormFactor, 'athletic_footwear');
  assert.ok(
    manInNikeScene.validationReport.contextSubjectLabel.includes('Wearing Nike Shoes'),
    'Should explicitly articulate Wearing Nike Shoes in validation label'
  );

  // 2. Places, Landmarks & Buildings understanding (without falsely rendering a human)
  const tajScene = buildPromptConstructedScene('Taj Mahal in Agra at sunrise', '16:9');
  assert.equal(tajScene.validationReport.isValidated, true);
  assert.equal(tajScene.primarySubjectArchetype, 'architectural_plaza');
  assert.equal(tajScene.promptDecomposition.humanAnatomy.hasHumanSubject, false);
  assert.equal(tajScene.promptDecomposition.architectureSpec.isPlaceOrBuilding, true);
  assert.equal(tajScene.promptDecomposition.architectureSpec.placeArchetype, 'taj_mahal_monument');

  const eiffelScene = buildPromptConstructedScene('Eiffel Tower in Paris France', '16:9');
  assert.equal(eiffelScene.primarySubjectArchetype, 'architectural_plaza');
  assert.equal(eiffelScene.promptDecomposition.architectureSpec.placeArchetype, 'eiffel_tower_paris');

  const burjScene = buildPromptConstructedScene('Burj Khalifa in Dubai skyline', '16:9');
  assert.equal(burjScene.primarySubjectArchetype, 'architectural_plaza');
  assert.equal(burjScene.promptDecomposition.architectureSpec.placeArchetype, 'burj_khalifa_dubai');

  const goldenTempleScene = buildPromptConstructedScene('Golden Temple Gurdwara in Amritsar', '16:9');
  assert.equal(goldenTempleScene.primarySubjectArchetype, 'architectural_plaza');
  assert.equal(goldenTempleScene.promptDecomposition.humanAnatomy.hasHumanSubject, false);
  assert.equal(goldenTempleScene.promptDecomposition.architectureSpec.placeArchetype, 'golden_temple_gurdwara');

  const hinduTempleScene = buildPromptConstructedScene('Ancient carved Hindu temple mandir', '16:9');
  assert.equal(hinduTempleScene.primarySubjectArchetype, 'architectural_plaza');
  assert.equal(hinduTempleScene.promptDecomposition.humanAnatomy.hasHumanSubject, false);
  assert.equal(hinduTempleScene.promptDecomposition.architectureSpec.placeArchetype, 'hindu_temple_shikhara');

  // 3. Storyboard shots for "Taj Mahal" do not inject synthetic "Subject" human triggers
  const tajShots = parsePromptIntoStoryboardShots('Taj Mahal in Agra');
  for (const shot of tajShots) {
    const shotDecomp = decomposePromptWithShardGrounding(shot.sentence);
    assert.equal(shotDecomp.humanAnatomy.hasHumanSubject, false);
    assert.equal(shotDecomp.architectureSpec.isPlaceOrBuilding, true);
  }

  // 4. Strict Zero-Default-Fallback Gate ("Image / Video generation failed")
  for (const invalidPrompt of ['asdfghjkl', 'qwertyuiop123', 'xyz999blorp', 'unknown topic', 'gibberish']) {
    const failedScene = buildPromptConstructedScene(invalidPrompt, '16:9');
    assert.equal(failedScene.promptDecomposition.canGenerateVisual, false, `Expected ${invalidPrompt} to fail`);
    assert.equal(failedScene.primarySubjectArchetype, 'generation_failed');
    assert.equal(failedScene.validationReport.isValidated, false);
    assert.equal(failedScene.validationReport.validationScorePct, 0);
    assert.ok(
      failedScene.validationReport.contextMatchStatus.includes('Image / Video generation failed'),
      `Expected failure message for ${invalidPrompt}`
    );
  }
});

test('Progressive Disclosure & Plural Visual Grounding: Pure Code synthesis (codeOnlyMarkdown), plural noun grounding, and Audio Synthesize', () => {
  // 1. Code mode separates pure code (codeOnlyMarkdown) from prose explanation (answerMarkdown)
  const codeSynth = generateOfflineCodeSynthesis(
    'Implement a thread-safe LRU cache with O(1) lookup',
    'TypeScript',
    'Q4_K_M',
    false
  );
  assert.ok(codeSynth.codingResolution?.codeOnlyMarkdown, 'Should include codeOnlyMarkdown');
  assert.ok(
    codeSynth.codingResolution?.codeOnlyMarkdown?.startsWith('```typescript'),
    'codeOnlyMarkdown should start directly with code fence'
  );
  assert.ok(
    !codeSynth.codingResolution?.codeOnlyMarkdown?.includes('Algorithmic Complexity'),
    'codeOnlyMarkdown must not include prose explanation headers'
  );
  assert.ok(
    codeSynth.answerMarkdown.includes('Algorithmic Complexity'),
    'Full answerMarkdown retains explanation for Show More'
  );

  // 2. Plural nouns & morphological variants pass strict visual grounding without false failure
  const pluralPrompts = [
    'Waves crashing on coastal rocks at sunset',
    'Modern glass skyscrapers and suspension bridges in a metropolis',
    'Golden retrievers playing in a green meadow with trees and flowers',
    'Bullet trains gliding past cherry blossoms',
    'Artisanal panini sandwiches on a cast-iron press',
  ];
  for (const p of pluralPrompts) {
    const scene = buildPromptConstructedScene(p, '16:9');
    assert.equal(scene.promptDecomposition.canGenerateVisual, true, `Expected plural prompt "${p}" to be grounded`);
    assert.notEqual(scene.primarySubjectArchetype, 'generation_failed', `Expected "${p}" not to fail`);
    assert.equal(scene.validationReport.isValidated, true, `Expected "${p}" to validate`);
  }

  // 3. Audio Synthesize mode produces playable WAV data URL and stem specification
  const audioSpec = synthesizeMusicTrackSpec('Synthesize an ambient lo-fi acoustic piano and rain audio track');
  assert.ok(audioSpec.title.length > 0);
  assert.ok(audioSpec.stems.length === 4);
  const wavUrl = generatePlayableWavDataUrl([261.63, 329.63, 392.0], audioSpec.bpm, 1.5);
  assert.ok(wavUrl.startsWith('data:audio/wav;base64,'));
});

test('Golden SVN Suite: Multi-human video & auto-background, Universal Image grounding, Hotel Kitchen Foley Audio, and Multi-Format Coding (Webpage/PPTX/DOCX/Excel + Unit Tests)', () => {
  // 1. Video Studio: Multiple human detection + automatic background selection + matched video audio
  const twoChefsScene = buildPromptConstructedScene(
    'Two chefs preparing artisanal dishes in a commercial hotel kitchen with sizzling pans and rising steam',
    '16:9'
  );
  assert.equal(twoChefsScene.promptDecomposition.canGenerateVisual, true);
  assert.equal(twoChefsScene.promptDecomposition.humanAnatomy.hasHumanSubject, true);
  assert.equal(twoChefsScene.promptDecomposition.humanAnatomy.humanCount, 2);
  assert.ok(
    twoChefsScene.promptDecomposition.autoBackgroundSummary?.includes('Auto-Selected'),
    'Should populate autoBackgroundSummary automatically from prompt'
  );
  assert.equal(
    twoChefsScene.actors.filter((a) => a.kind === 'human_figure').length,
    2,
    'Actors list should contain 2 human_figure actors for Two chefs'
  );
  const kitchenVideoAudio = synthesizeVeo3SynchronizedAudioSpec(
    'Two chefs preparing artisanal dishes in a commercial hotel kitchen with sizzling pans'
  );
  assert.equal(kitchenVideoAudio.foleyMode, 'sizzle');
  assert.ok(
    kitchenVideoAudio.foleyDescription.includes('hotel kitchen') ||
      kitchenVideoAudio.ambientSoundscape.includes('Kitchen Brigade'),
    'Video audio should match hotel kitchen food preparation'
  );

  const threeEngineersDecomp = decomposePromptWithShardGrounding(
    'Three engineers discussing industrial turbine schematics on a factory floor'
  );
  assert.equal(threeEngineersDecomp.humanAnatomy.hasHumanSubject, true);
  assert.equal(threeEngineersDecomp.humanAnatomy.humanCount, 3);

  // 2. Image Studio: Universal natural-language prompts succeed without "unrecognised or ungroundable prompt"
  const universalPrompts = [
    'A serene botanical conservatory at golden sunrise with glass arches and tropical orchids',
    'Vintage brass telescope inside a cozy wooden attic library overlooking starry skies',
    'Futuristic autonomous delivery drone hovering above a suburban rooftop terrace',
  ];
  for (const up of universalPrompts) {
    const upScene = buildPromptConstructedScene(up, '16:9');
    assert.equal(
      upScene.promptDecomposition.canGenerateVisual,
      true,
      `Expected universal natural-language prompt "${up}" to synthesize cleanly`
    );
    assert.notEqual(upScene.primarySubjectArchetype, 'generation_failed');
    assert.equal(upScene.validationReport.isValidated, true);
  }

  // 3. Audio Synthesize: Hotel kitchen food preparation prompt generates realistic kitchen foley stems & WAV
  const kitchenAudio = synthesizeMusicTrackSpec(
    'Generate audio for the kitchen area of a hotel where food is being prepared with sizzling pans and chopping'
  );
  assert.equal(kitchenAudio.acousticSceneCategory, 'hotel_kitchen_foley');
  assert.ok(kitchenAudio.genre.includes('Commercial Hotel Kitchen'));
  assert.equal(kitchenAudio.stems.length, 4);
  assert.ok(
    kitchenAudio.stems.some((s) => s.name.includes('Sizzle')),
    'Kitchen audio should include cast-iron pan sizzle stem'
  );
  assert.ok(
    kitchenAudio.stems.some((s) => s.name.includes('Knife')),
    'Kitchen audio should include chef knife chopping stem'
  );
  assert.ok(kitchenAudio.wavDataUrl.startsWith('data:audio/wav;base64,'));

  // 4. Coding Studio: Unit test suite (4/4 PASS) + Live Webpage HTML + PPTX / DOCX / Excel multi-format artifacts
  const codingRes = generateOfflineCodeSynthesis(
    'Build an enterprise financial & retail telemetry dashboard with Webpage, PowerPoint PPTX, Word DOCX, and Excel exports',
    'TypeScript',
    'Q4_K_M',
    false
  );
  assert.ok(codingRes.codingResolution, 'Coding resolution must be present');
  assert.ok(
    codingRes.codingResolution.liveWebpageHtml &&
      codingRes.codingResolution.liveWebpageHtml.includes('<!DOCTYPE html>'),
    'Should include complete interactive HTML5 webpage preview'
  );
  assert.ok(
    codingRes.codingResolution.unitTestSuite &&
      codingRes.codingResolution.unitTestSuite.length === 4 &&
      codingRes.codingResolution.unitTestSuite.every((u) => u.status === 'PASS'),
    'Should include 4 passing unit test assertions'
  );
  assert.ok(
    codingRes.codingResolution.multiFormatArtifacts &&
      codingRes.codingResolution.multiFormatArtifacts.length === 5,
    'Should include 5 multi-format artifacts (source, webpage_html, pptx_deck, docx_document, excel_xlsx)'
  );
  const formatIds = codingRes.codingResolution.multiFormatArtifacts!.map((a) => a.formatId);
  assert.deepEqual(formatIds, [
    'source',
    'webpage_html',
    'pptx_deck',
    'docx_document',
    'excel_xlsx',
  ]);
});

test('Sovereign Master v5.1..v6.0 LTS Suite: Bar/Cafe Receipt PDF, Zero-Assumption Clarification Gate, Panini-LyraVox Vocal Lyrics & Background Adaptation, and Off-the-Hook Multilingual Detection', () => {
  // 1. Short/underspecified receipt prompt MUST trigger Zero-Assumption Interactive Clarification Gate
  const shortBarReceipt = synthesizeCommercialReceiptSpec('bar receipt');
  assert.equal(
    shortBarReceipt.needsParameterClarification,
    true,
    'Short prompt "bar receipt" must require interactive parameter clarification instead of silently assuming'
  );
  assert.ok(
    shortBarReceipt.missingParameters.length >= 4,
    'Clarification gate should provide structured parameter fields (Venue, Items, Currency, Tax/Tip)'
  );

  // 2. Confirmed or detailed receipt prompt resolves with exact line-item arithmetic & exports valid %PDF-1.4 bytes
  const confirmedCafeReceipt = synthesizeCommercialReceiptSpec('cafe receipt', {
    venueType: 'specialty_cafe_roastery',
    venueName: 'Sutra & Steam Specialty Cafe',
    currencySymbol: '$',
    taxRatePct: 8.0,
    serviceChargePct: 10.0,
    lineItemsText: '2x Oat Milk Cortado @ 5.50, 1x Almond Butter Croissant @ 6.00',
    clarificationConfirmed: true,
  });
  assert.equal(confirmedCafeReceipt.needsParameterClarification, false);
  assert.equal(confirmedCafeReceipt.subtotal, 17.0);
  const expectedNet = Number((17.0 - confirmedCafeReceipt.discountAmount).toFixed(2));
  const expectedTax = Number((expectedNet * 0.08).toFixed(2));
  const expectedSvc = Number((expectedNet * 0.1).toFixed(2));
  assert.equal(confirmedCafeReceipt.taxAmount, expectedTax);
  assert.equal(confirmedCafeReceipt.serviceChargeAmount, expectedSvc);
  assert.equal(
    confirmedCafeReceipt.grandTotal,
    Number((expectedNet + expectedTax + expectedSvc).toFixed(2))
  );

  const formattedMarkdown = formatReceiptForPdfExport(confirmedCafeReceipt);
  const pdfBytes = generatePdfDocumentBytes(
    `${confirmedCafeReceipt.establishmentName} — Official Receipt`,
    'cafe receipt',
    formattedMarkdown,
    'History'
  );
  const pdfAscii = new TextDecoder().decode(pdfBytes);
  assert.ok(pdfAscii.startsWith('%PDF-1.4'), 'Exported receipt PDF must begin with %PDF-1.4 header');
  assert.ok(
    pdfAscii.includes('SUTRA & STEAM SPECIALTY CAFE'),
    'PDF must contain uppercase merchant header'
  );
  assert.ok(pdfAscii.includes('GRAND TOTAL'), 'PDF must contain GRAND TOTAL line');

  // 3. Scene builder routes bar/cafe receipt prompts to commercial_receipt_pos and attaches qualityMultiPassSpec
  const barReceiptScene = buildPromptConstructedScene(
    'Generate a craft cocktail bar receipt for 2 espresso martinis and truffle fries with PDF export',
    '16:9'
  );
  assert.equal(barReceiptScene.primarySubjectArchetype, 'commercial_receipt_pos');
  assert.ok(barReceiptScene.commercialReceiptSpec, 'Scene must include commercialReceiptSpec');
  assert.ok(barReceiptScene.qualityMultiPassSpec, 'Scene must include qualityMultiPassSpec');
  assert.equal(
    barReceiptScene.qualityMultiPassSpec?.sovereignModelUsed,
    'Panini-Omega-2.0T (Panini-Aether-3D)'
  );
  assert.equal(barReceiptScene.qualityMultiPassSpec?.passesCompleted, 4);

  // 4. Panini-LyraVox Vocal Music with Words, Lyrics & Background Adaptation
  const vocalTrack = synthesizeMusicTrackSpec(
    'Compose a vocal song with lyrics and words for a craft cocktail bar'
  );
  assert.equal(vocalTrack.sovereignAudioEngine, 'Panini-LyraVox-v5.3');
  assert.equal(vocalTrack.hasVocalLyrics, true);
  assert.ok(
    vocalTrack.lyricsStanzas && vocalTrack.lyricsStanzas.length >= 4,
    'Track must include 4 structured lyric stanzas (Verse 1, Chorus, Bridge, Outro)'
  );
  assert.ok(
    vocalTrack.sungWordsTranscript && vocalTrack.sungWordsTranscript.length > 20,
    'Track must include sungWordsTranscript'
  );
  assert.equal(
    vocalTrack.visualBackgroundAdaptation?.backgroundSceneId,
    'craft_cocktail_bar'
  );

  const adaptedToCafe = adaptMusicTrackToVisualBackground(vocalTrack, 'specialty_cafe');
  assert.equal(
    adaptedToCafe.visualBackgroundAdaptation?.backgroundSceneId,
    'specialty_cafe'
  );
  assert.ok(adaptedToCafe.wavDataUrl.startsWith('data:audio/wav;base64,'));

  // 5. Off-the-Hook Multilingual Speech & Text Detection across global languages
  const hindiDetect = detectMultilingualSpeechAndText(
    'नमस्ते, मुझे महर्षि पाणिनि के अष्टाध्यायी सूत्रों के बारे में बताएं'
  );
  assert.equal(hindiDetect.detectedLanguageCode, 'hi');
  assert.equal(hindiDetect.speechSynthesisBcp47, 'hi-IN');

  const punjabiDetect = detectMultilingualSpeechAndText(
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਅੰਮ੍ਰਿਤਸਰ ਦੇ ਕੈਫੇ ਲਈ ਕੌਫੀ ਦੀ ਰਸੀਦ ਬਣਾਓ'
  );
  assert.equal(punjabiDetect.detectedLanguageCode, 'pa');
  assert.equal(punjabiDetect.speechSynthesisBcp47, 'pa-IN');

  const spanishDetect = detectMultilingualSpeechAndText(
    'Hola, por favor genera un recibo de cafetería con dos cafés'
  );
  assert.equal(spanishDetect.detectedLanguageCode, 'es');
  assert.equal(spanishDetect.speechSynthesisBcp47, 'es-ES');

  const englishDetect = detectMultilingualSpeechAndText(
    'Generate a craft cocktail bar receipt with PDF export'
  );
  assert.equal(englishDetect.detectedLanguageCode, 'en');
  assert.equal(englishDetect.speechSynthesisBcp47, 'en-US');

  // 6. Sovereign Master Model Panini-Omega-2.0T is registered in INITIAL_MODELS
  assert.ok(
    INITIAL_MODELS.some(
      (m) =>
        m.id === 'panini-omega-2t-sovereign' &&
        m.totalParamsBillions === 2000 &&
        m.activeParamsBillions === 64
    ),
    'Panini-Omega-2.0T-Sovereign-Master (2,000B Total / 64B Active) must be registered in INITIAL_MODELS'
  );

  // 7. Dubai Hotel in Jumeirah 800 AED receipt prompt: exact 800.00 AED total, AED currency, black background, white paper, real Jumeirah location, and pure receipt-only PDF
  const dubaiPrompt =
    'Live Synthesize 8K Master Image: Generate a receipt for 800 AED for Dubai Hotel in Jumeirah area. The background should be black and not other backgrounds Receipt should be white in color. Use real location Provide Itemized data with price in AED. It should look like real receipt';
  const dubaiSpec = synthesizeCommercialReceiptSpec(dubaiPrompt);
  assert.equal(dubaiSpec.currencySymbol, 'AED');
  assert.equal(dubaiSpec.venueType, 'luxury_hotel_folio');
  assert.ok(
    dubaiSpec.establishmentName.includes('JUMEIRAH') &&
      dubaiSpec.establishmentName.includes('DUBAI'),
    `Expected Jumeirah Dubai hotel name, got: ${dubaiSpec.establishmentName}`
  );
  assert.ok(
    dubaiSpec.branchAddress.includes('Jumeirah') && dubaiSpec.branchAddress.includes('Dubai, UAE'),
    `Expected real Jumeirah Dubai street address, got: ${dubaiSpec.branchAddress}`
  );
  assert.ok(
    dubaiSpec.taxRegistrationId.includes('UAE FTA TRN'),
    `Expected UAE FTA TRN registration, got: ${dubaiSpec.taxRegistrationId}`
  );
  assert.equal(dubaiSpec.taxRatePct, 5.0);
  assert.equal(dubaiSpec.serviceChargePct, 10.0);
  assert.equal(dubaiSpec.grandTotal, 800.0);
  assert.equal(
    Number((dubaiSpec.subtotal + dubaiSpec.taxAmount + dubaiSpec.serviceChargeAmount).toFixed(2)),
    800.0,
    'Subtotal + 5% VAT + 10% Service Charge must equal exact 800.00 AED'
  );
  assert.equal(dubaiSpec.backgroundColorHex, '#000000');
  assert.equal(dubaiSpec.thermalPaperTintHex, '#FFFFFF');
  assert.equal(dubaiSpec.needsParameterClarification, false);
  assert.equal(formatReceiptCurrencyAmount(dubaiSpec.grandTotal, dubaiSpec.currencySymbol), '800.00 AED');

  // Even when prompt includes the word "GST" alongside "AED", currency must remain AED (never INR ₹ or USD $)
  const dubaiWithGstText = synthesizeCommercialReceiptSpec(
    `${dubaiPrompt} is concise and did not specify all receipt parameters (Venue Name, Itemized Drinks/Dishes, Currency is AED, Tax/GST of 5%, and Service Charge 10% and PDF report should not have any header footer and no additional data except the actual receipt`
  );
  assert.equal(dubaiWithGstText.currencySymbol, 'AED');
  assert.equal(dubaiWithGstText.grandTotal, 800.0);
  assert.equal(dubaiWithGstText.taxRatePct, 5.0);
  assert.equal(dubaiWithGstText.serviceChargePct, 10.0);

  // Scene builder for Dubai receipt must use pure #000000 background and zero silhouette/weather distractions
  const dubaiScene = buildPromptConstructedScene(dubaiPrompt, '16:9');
  assert.equal(dubaiScene.primarySubjectArchetype, 'commercial_receipt_pos');
  assert.equal(dubaiScene.skyGradient[0], '#000000');
  assert.equal(dubaiScene.groundGradient[0], '#000000');
  assert.equal(dubaiScene.weatherParticles, 'none');
  assert.equal(dubaiScene.architectureSilhouettes.length, 0);

  // Pure Receipt PDF export must contain ONLY the receipt and ZERO headers, footers, model names, XAI, or bibliography
  const purePdfBytes = generatePureReceiptPdfBytes(dubaiSpec);
  const purePdfText = new TextDecoder().decode(purePdfBytes);
  assert.ok(purePdfText.startsWith('%PDF-1.4'));
  assert.ok(purePdfText.includes('JUMEIRAH AL NASEEM HOTEL DUBAI'));
  assert.ok(purePdfText.includes('800.00 AED'));
  assert.ok(!purePdfText.includes('PANINI 400B'), 'Pure receipt PDF must NOT include PANINI 400B report header');
  assert.ok(!purePdfText.includes('Explainable AI'), 'Pure receipt PDF must NOT include Explainable AI section');
  assert.ok(!purePdfText.includes('BIBLIOGRAPHY'), 'Pure receipt PDF must NOT include BIBLIOGRAPHY section');
  assert.ok(!purePdfText.includes('Report Title:'), 'Pure receipt PDF must NOT include Report Title metadata');
  assert.ok(!purePdfText.includes('Engine:'), 'Pure receipt PDF must NOT include Engine telemetry line');
});

test('Release v5.2 (SVN-r402.0) Panini-Synapse-Distiller: Maturity Schedule (Hourly/Daily/Weekly/Air-Gap), Zero-Assumption Learning Clarification Gate, Self-Updating Use-Case Library (SCN-10006..SCN-10008+), and Pure Ledger PDF Export', () => {
  // 1. Verify SCN-10006, SCN-10007, SCN-10008 are registered in INITIAL_CUSTOM_SCENARIOS with clean starterPrompts (zero XAI clutter)
  const scn6 = INITIAL_CUSTOM_SCENARIOS.find((s) => s.id === 'SCN-10006');
  const scn7 = INITIAL_CUSTOM_SCENARIOS.find((s) => s.id === 'SCN-10007');
  const scn8 = INITIAL_CUSTOM_SCENARIOS.find((s) => s.id === 'SCN-10008');
  assert.ok(scn6, 'SCN-10006 must exist in INITIAL_CUSTOM_SCENARIOS');
  assert.ok(scn7, 'SCN-10007 must exist in INITIAL_CUSTOM_SCENARIOS');
  assert.ok(scn8, 'SCN-10008 must exist in INITIAL_CUSTOM_SCENARIOS');
  assert.equal(scn6?.sovereignEngineModule, 'Panini-Mercantile-Doc');
  assert.equal(scn6?.targetCapability, 'image_gen');
  assert.ok(
    !scn6?.starterPrompt.includes('Explainable AI (XAI) attribution'),
    'SCN-10006 starterPrompt must be clean without trailing XAI boilerplate'
  );
  assert.equal(scn7?.sovereignEngineModule, 'Panini-LyraVox');
  assert.equal(scn7?.targetCapability, 'audio_gen');
  assert.equal(scn8?.learnedSource, 'Scheduled Internet Sync');

  // 2. Verify Maturity Schedule Calculation across Hourly, Daily, Weekly, and Sovereign Air-Gap
  const nascentModel = { ...INITIAL_MODELS[0], selfLearningSamplesCount: 1 };
  const nascentMaturity = calculateModelMaturityAndSchedule(nascentModel, 1, 0);
  assert.equal(nascentMaturity.recommendedCadence, 'hourly');
  assert.equal(nascentMaturity.intervalHours, 1);

  const developingMaturity = calculateModelMaturityAndSchedule(
    INITIAL_MODELS[0],
    INITIAL_CUSTOM_SCENARIOS.length,
    4
  );
  assert.equal(developingMaturity.recommendedCadence, 'daily');
  assert.equal(developingMaturity.intervalHours, 24);

  const matureModel = { ...INITIAL_MODELS[1], selfLearningSamplesCount: 28 };
  const matureEval = calculateModelMaturityAndSchedule(
    matureModel,
    INITIAL_CUSTOM_SCENARIOS.length,
    6,
    'weekly'
  );
  assert.equal(matureEval.activeCadence, 'weekly');
  assert.equal(matureEval.intervalHours, 168);
  assert.ok(matureEval.sovereignEquivalenceMatrix.length >= 4);

  // 3. Zero-Assumption Clarification Gate for underspecified custom learning topics
  const underspecifiedHarvest = executeContinualLearningHarvest({
    customLearningPrompt: 'receipt',
    clarificationConfirmed: false,
    existingScenarios: INITIAL_CUSTOM_SCENARIOS,
    cadence: 'daily',
    activeModel: INITIAL_MODELS[1],
  });
  assert.equal(
    underspecifiedHarvest.needsClarification,
    true,
    'Short underspecified learning prompt must trigger Zero-Assumption Clarification Gate'
  );
  assert.ok(
    underspecifiedHarvest.suggestedClarificationPrompts &&
      underspecifiedHarvest.suggestedClarificationPrompts.length >= 3
  );

  // 4. Detailed or User-Telemetry Harvest registers SCN-10009 with exact parameters and clean starterPrompt
  const detailedHarvest = executeContinualLearningHarvest({
    customLearningPrompt:
      'Generate a receipt for 1250 SAR for Riyadh Luxury Hotel with black background, white receipt paper, and 15% VAT in SAR',
    clarificationConfirmed: false,
    existingScenarios: INITIAL_CUSTOM_SCENARIOS,
    cadence: 'daily',
    activeModel: INITIAL_MODELS[1],
    actorName: 'Dr. Elena Rostova',
  });
  assert.equal(detailedHarvest.needsClarification, false);
  assert.equal(detailedHarvest.newScenario?.id, 'SCN-10009');
  assert.equal(detailedHarvest.newScenario?.sovereignEngineModule, 'Panini-Mercantile-Doc');
  assert.equal(detailedHarvest.newScenario?.targetCapability, 'image_gen');
  assert.ok(
    !detailedHarvest.newScenario?.starterPrompt.includes('Explainable AI'),
    'Harvested scenario starterPrompt must not contain unwanted XAI boilerplate'
  );

  // 5. Pure Use-Case Ledger PDF Export contains ONLY the Use-Case Ledger (zero bibliography or XAI sections)
  const ledgerPdfBytes = generatePureLearningLedgerPdfBytes(
    [detailedHarvest.newScenario!, ...INITIAL_CUSTOM_SCENARIOS],
    matureEval
  );
  const ledgerPdfText = new TextDecoder().decode(ledgerPdfBytes);
  assert.ok(ledgerPdfText.startsWith('%PDF-1.4'));
  assert.ok(ledgerPdfText.includes('PANINI-SYNAPSE-DISTILLER'));
  assert.ok(ledgerPdfText.includes('SCN-10009'));
  assert.ok(ledgerPdfText.includes('SCN-10006'));
  assert.ok(!ledgerPdfText.includes('VERIFIED BIBLIOGRAPHY'));
  assert.ok(!ledgerPdfText.includes('Explainable AI'));
});

test('Release v5.2.1 -> v5.3 (SVN-r403.0) Regression & Continual Model Evolution Gate: Executive Chefs in Commercial Hotel Kitchen, Mahatma Gandhi Dandi Salt March Multi-Shot Persona, and Prompt-Driven Model Weight Evolution', () => {
  // 1. Executive Chefs in Commercial Hotel Kitchen (must wear chef coats & chef toque hats, never business suits or orange Nike sneakers, in a commercial kitchen with copper cookware & sizzling foley)
  const chefPrompt =
    'Live Synthesize 8K Master Video: Two executive chefs plating artisanal dishes in a commercial hotel kitchen with rising steam, copper cookware, and synchronized sizzling foley audio';
  const chefScene = buildPromptConstructedScene(chefPrompt, '16:9');
  assert.equal(chefScene.promptDecomposition.canGenerateVisual, true);
  assert.equal(chefScene.primarySubjectArchetype, 'culinary_dish_platter');
  assert.equal(chefScene.horizonType, 'culinary_counter');
  assert.equal(chefScene.promptDecomposition.humanAnatomy.hasHumanSubject, true);
  assert.equal(chefScene.promptDecomposition.humanAnatomy.humanCount, 2);
  assert.equal(
    chefScene.promptDecomposition.humanAnatomy.wardrobeStyle,
    'chef_culinary_coat',
    'Executive chefs must wear chef_culinary_coat and NEVER banking_executive_suit'
  );
  assert.equal(
    chefScene.promptDecomposition.humanAnatomy.headwear,
    'chef_toque_hat',
    'Executive chefs must wear tall pleated white chef hats (chef_toque_hat)'
  );
  assert.equal(
    chefScene.promptDecomposition.brandSpec.isBranded,
    false,
    'Must not render unrequested athletic sneakers on chefs'
  );
  assert.equal(chefScene.veo3AudioSpec?.foleyMode, 'sizzle');
  assert.ok(
    chefScene.veo3AudioSpec?.foleyDescription.includes('copper') &&
      chefScene.veo3AudioSpec?.foleyDescription.includes('knife'),
    'Kitchen audio spec must include copper cookware clinks and chef knife chopping alongside sizzling pans'
  );

  // 2. Mahatma Gandhi Dandi Salt March Multi-Shot Video (must render Gandhi with bald elder head, round spectacles, white Khadi dhoti, bamboo staff, and followers on Dandi coastal salt shore across all shots)
  const gandhiPrompt =
    'Explain Mahatma Gandhi’s Dandi Salt March in simple everyday terms and generate a multi-shot video: Gandhi walking peacefully with followers along a sunlit coastal road, then picking up natural sea salt at the Dandi ocean shore, and finally inspiring a peaceful gathering under golden evening light.';
  const gandhiScene = buildPromptConstructedScene(gandhiPrompt, '16:9');
  assert.equal(gandhiScene.promptDecomposition.canGenerateVisual, true);
  assert.equal(gandhiScene.horizonType, 'ocean_waves');
  assert.equal(gandhiScene.promptDecomposition.humanAnatomy.hasHumanSubject, true);
  assert.equal(
    gandhiScene.promptDecomposition.humanAnatomy.humanCount,
    3,
    'Gandhi walking with followers must render multiple human figures (Gandhi + followers)'
  );
  assert.equal(gandhiScene.promptDecomposition.humanAnatomy.wardrobeStyle, 'gandhi_khadi_dhoti');
  assert.equal(gandhiScene.promptDecomposition.humanAnatomy.hairStructure, 'bald_elder');
  assert.equal(gandhiScene.promptDecomposition.humanAnatomy.hasRoundSpectacles, true);
  assert.equal(gandhiScene.promptDecomposition.humanAnatomy.hasWalkingStaff, true);
  assert.equal(gandhiScene.promptDecomposition.brandSpec.isBranded, false);

  // Verify Shot 2 combined with full prompt context retains Mahatma Gandhi persona
  const shot2CombinedScene = buildPromptConstructedScene(
    `then picking up natural sea salt at the Dandi ocean shore — Full Scene Context: ${gandhiPrompt}`,
    '16:9'
  );
  assert.equal(
    shot2CombinedScene.promptDecomposition.humanAnatomy.wardrobeStyle,
    'gandhi_khadi_dhoti',
    'Shot 2 must preserve Mahatma Gandhi Khadi dhoti persona'
  );
  assert.equal(shot2CombinedScene.promptDecomposition.humanAnatomy.hasRoundSpectacles, true);

  // 3. Continual Model Weight Evolution across Prompts, Scenarios & Admin "Learn & Update Now"
  const baseModel = INITIAL_MODELS[1]; // Panini-Omega-2.0T
  const baseHeadVer = baseModel.versions[0];
  const evolved1 = applyPromptScenarioToModelLearning(
    baseModel,
    chefPrompt,
    'Live Prompt Execution',
    'Dr. Elena Rostova',
    2
  );
  assert.equal(
    evolved1.updatedModel.selfLearningSamplesCount,
    baseModel.selfLearningSamplesCount + 2
  );
  assert.ok(
    evolved1.updatedModel.accuracyBenchmarkPct > baseModel.accuracyBenchmarkPct,
    'Continual learning must progressively improve model accuracyBenchmarkPct'
  );
  assert.ok(
    evolved1.updatedModel.versions[0].loraRank > baseHeadVer.loraRank,
    'Continual learning must upgrade active QLoRA rank'
  );
  assert.ok(
    evolved1.updatedModel.continualLearningHistory &&
      evolved1.updatedModel.continualLearningHistory.length >= 3,
    'Must append ModelContinualLearningUpgradeRecord to continualLearningHistory'
  );
  assert.equal(
    evolved1.upgradeRecord.targetSubsystem,
    'Panini-Kinesis-Cinema-8K (Culinary Brigade & Foley Physics)'
  );
});
