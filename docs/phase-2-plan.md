# Agent Arena Phase 2: The Agent Workshop

## Product thesis

Phase 1 proves the core spectacle: configure a small local model, put it in an arena, and watch it act. Phase 2 should prove the habit-forming loop: a player can make a deliberate change to an agent's prompt or harness, run a fair experiment, understand the outcome, and keep the winning version.

The product is not primarily a chat interface wrapped around combat. It is a compact, visual workbench for agent engineering. A good session ends with a player able to say: “this rule made my agent stop wasting energy while out of range” and with evidence to support it.

## What Phase 1 establishes

The current prototype already has the right foundation:

- React/Vite client with a configuration screen and live 12x12 battle view.
- Four harnesses, a tick-based engine, action validation, and a simulation fallback.
- Optional Ollama discovery and generation for the player's agent.
- A battle log that displays the selected action and the model-supplied reason.

There are important gaps to resolve before expanding gameplay:

- The opponent is always a deterministic heuristic, so this is not yet model-versus-model evaluation.
- A stated `reason` is not reliable evidence of why the model chose an action; raw response, prompt, state, parse result, and outcome are not persisted together.
- Random damage and random opponent harnesses make prompt changes difficult to compare fairly.
- The engine does not enforce attack range or apply the advertised defensive reduction, which weakens trust in explanations and results.
- Match results are discarded when the app returns to configuration; there is no history, replay, baseline, or versioning.
- The current “streaming” service consumes a complete stream internally, so it cannot yet improve the in-battle experience.

Phase 2 should treat these as product requirements, not merely technical cleanup.

## Phase 2 outcome

Deliver a local-first “Agent Workshop” where a player can:

1. Configure both sides of a match, including model, prompt, harness, and inference settings.
2. Save named immutable agent versions and choose a baseline to compare against.
3. Run one match for observation or a small seeded match set for evaluation.
4. Inspect every decision as a trace: what the agent was shown, what it returned, how it was parsed and validated, what happened, and what a simple rule-based analysis recommends.
5. Replay a finished match deterministically and compare a candidate against its baseline on the same scenario set.
6. Keep performance data on-device, with an explicit export/import path for portable configurations and match reports.

## Scope boundaries

### In scope

- 1v1 local battles and a curated scenario library.
- Ollama plus OpenAI-compatible local HTTP endpoints (for example LM Studio and llama.cpp servers).
- Structured action output, decision traces, performance metrics, replays, configuration versioning, and baseline comparison.
- Explainability that distinguishes model-provided rationale from observed facts and deterministic analysis.
- Lightweight local persistence and export/import.

### Deliberately out of scope

- Accounts, cloud synchronization, public sharing, rankings, or a global leaderboard.
- Team battles, items, hazards, tournaments, or user-authored scripting.
- Claims that the UI can reveal a model's hidden chain of thought.
- Training, fine-tuning, or automated prompt rewriting.

These belong after the evaluation loop is credible. Social competition without repeatable evaluation will reward noise.

## Experience design

### 1. Workshop

Replace the one-off configuration screen with a two-column workbench:

- **Candidate**: editable model, endpoint, harness, system prompt, temperature, seed policy, and token limit.
- **Baseline**: a pinned saved version or the current candidate's previous version.
- **Opponent**: configurable model agent or a labeled reference bot; clearly identify whether it is an LLM or deterministic harness.
- **Scenario**: select a named setup with starting positions, fixed harnesses, seed, ruleset, and objective.

The main action is `Run evaluation`; `Watch one battle` remains available for exploratory play. Save creates a new version rather than silently overwriting a prior experiment.

### 2. Live battle

Keep the arena visible, but make each tick legible:

- Show a short “thinking / generating / validated” status per agent, plus elapsed inference time.
- Animate only state changes that occurred; pace playback independently from inference time.
- Open a decision inspector when the player selects a tick or action.
- Mark invalid, repaired, timeout, and fallback actions visually; never present them as a normal strategic choice.

Streaming is useful here only as a responsive status/partial-output affordance. Action execution must wait for a complete, validated structured response.

### 3. Results and comparison

End each run in a report, not a generic victory modal:

- Headline: win rate, average remaining HP, invalid-action rate, timeout rate, and median decision latency.
- Delta against the baseline on the identical scenario seeds.
- Decision-quality findings such as “attacked while out of range 6 times” or “charged below 10 energy on 4 of 4 opportunities.”
- A ranked list of pivotal turns based on immediate impact and rule violations, each linked to replay.
- Clear next experiments, phrased as hypotheses rather than automatic prompt edits.

## Explainability model

Every turn creates a durable `DecisionTrace`. This is the central Phase 2 artifact.

```ts
type DecisionTrace = {
  traceId: string
  matchId: string
  tick: number
  agentVersionId: string
  input: {
    state: BattleState
    allowedActions: ActionSchema
    promptTemplateVersion: string
    memory: MemoryEntry[]
  }
  inference: {
    provider: 'ollama' | 'openai-compatible' | 'simulation'
    model: string
    startedAt: string
    latencyMs: number
    promptTokens?: number
    completionTokens?: number
    tokensPerSecond?: number
    rawResponse?: string
  }
  decision: {
    requested: Action | null
    executed: Action
    status: 'valid' | 'repaired' | 'fallback' | 'timeout' | 'error'
    modelRationale?: string
    validationMessages: string[]
  }
  outcome: {
    stateBefore: BattleState
    stateAfter: BattleState
    events: BattleEvent[]
  }
}
```

Present the data in three explicit layers:

| Layer | What it says | Trust level |
| --- | --- | --- |
| Model rationale | The brief explanation supplied in the model's structured response. | A self-report, not proof of internal reasoning. |
| Decision record | Input state, allowed actions, raw output, parse/repair, executed action, timing, and game events. | Reproducible evidence. |
| Arena analysis | Deterministic checks and optional heuristics applied after the action. | Explainable and versioned; label heuristic conclusions as such. |

Start with deterministic findings: out-of-range attacks, invalid directions, insufficient-energy attempts, missed legal attack opportunities, low-energy charging opportunities, repeated no-op movement, and defensive actions preceding damage. Add counterfactual suggestions cautiously: “A legal attack was available” is evidence; “an attack would have won” requires a sandboxed simulator and must be labeled as an estimate.

Do not request or display private chain-of-thought. Ask models for a concise `rationale` field, bounded to one sentence, alongside schema-constrained action output.

## Fair evaluation and replay

Introduce a `Scenario` plus explicit seed as the unit of repeatability. A scenario fixes arena layout, objective, starting states, opponent version, ruleset version, and action-order policy. The PRNG seed controls damage and any other chance.

An evaluation suite is a small, fixed list of scenarios, initially 8-12. It should cover at least:

- approach and first-contact behavior;
- low-energy recovery;
- finishing an exposed opponent;
- defending under threat;
- positioning at arena edges; and
- timeout survival.

Candidate and baseline runs must use the same suite, seed list, engine version, and inference budget. Store the complete event sequence so replay does not invoke the model again. A match report is therefore inspectable even when the local endpoint is offline.

## Technical plan

### Workstream A: trustworthy rules and deterministic engine

1. Move harness definitions, rules, action schema, range rules, and action effects into one shared game-rules module.
2. Correct combat semantics: enforce action range, apply defense duration/reduction, document action order, and emit typed events for every state change.
3. Inject a seeded PRNG into match creation/execution; remove direct `Math.random()` use from the engine.
4. Add engine unit tests for valid/invalid actions, damage, defense, range, movement bounds, win conditions, and deterministic replay.

**Exit criterion:** the same initial state, action sequence, ruleset version, and seed produce byte-equivalent events and final state.

### Workstream B: provider and structured-output layer

1. Replace the Ollama singleton with a provider interface: connection test, model discovery, generate, optional stream callback, and normalized usage metadata.
2. Implement Ollama and OpenAI-compatible adapters. Treat provider capabilities as discovered configuration, not assumed behavior.
3. Use schema-first prompting: compact state, allowed actions, explicit range/energy constraints, one concise rationale, strict JSON object.
4. Parse defensively, validate against the game schema, record raw output, and use a visibly recorded fallback policy.
5. Add per-decision timeout, cancellation, and retry rules; ensure an interrupted match cannot keep writing state after navigation.

**Exit criterion:** a provider error, malformed answer, or slow answer produces a traceable declared outcome rather than a silent default attack.

### Workstream C: trace, storage, and replay

1. Define versioned models for agent versions, scenarios, match records, decision traces, and evaluation summaries.
2. Persist locally with IndexedDB; use a small repository layer so storage can later move to a server without rewriting the UI.
3. Implement JSON export/import with schema version validation and no embedded endpoint credentials.
4. Build a pure replay reducer from stored events; include playback speed, scrubber, turn selection, and side-by-side state comparison.

**Exit criterion:** a completed match can be re-opened, replayed, exported, and imported with the same visible result.

### Workstream D: workshop and results UI

1. Add route-level screens: Workshop, Battle, Results, Replay, and local History.
2. Build agent version save/duplicate/rename and baseline selection. Preserve a read-only snapshot on match start.
3. Add opponent and scenario selection, a single-match mode, and a suite-evaluation mode.
4. Build the decision inspector and results comparison around `DecisionTrace`, including filters for validation failures and critical turns.
5. Make simulation mode a first-class, clearly labeled provider so users never mistake it for LLM behavior.

**Exit criterion:** a new player can run a baseline/candidate comparison and identify the exact turns that created the largest measurable difference.

## Delivery sequence

| Milestone | Focus | Demonstrable outcome |
| --- | --- | --- |
| 2.0: Rules you can trust | Workstream A | Seeded replay and accurate, tested combat rules. |
| 2.1: Decisions you can inspect | Workstream B + trace foundation | Structured per-turn records with provider/latency/error visibility. |
| 2.2: Matches you can revisit | Workstream C | Persistent history, deterministic replay, export/import. |
| 2.3: Experiments you can compare | Workstream D | Candidate-versus-baseline suite results and actionable findings. |
| 2.4: Broader local compatibility | Provider polish | Configurable Ollama/OpenAI-compatible endpoints, model discovery, streaming UI. |

This order is intentional: streaming and provider breadth are valuable, but neither creates a useful optimization loop without trusted rules, stable traces, and fair comparisons.

## Measurement and acceptance criteria

Track product quality locally and show the useful parts to players:

- **Reliability:** schema-valid responses, repaired/fallback rate, provider error rate, and timeout rate.
- **Responsiveness:** p50/p95 time to first token (where supported), decision latency, completion tokens, and tokens per second.
- **Agent quality:** win rate, average HP differential, energy efficiency, rule-violation rate, and objective completion.
- **Experiment value:** percentage of evaluations compared to a baseline; percentage of result views that open a pivotal decision/replay.

Phase 2 is complete when all of the following are true:

1. A player can save two versions of an agent and run both against the same 8+ seeded scenarios.
2. The results view reports deltas with sample counts and links to the affected matches.
3. Every executed LLM action is traceable to its visible input state, raw output or error, validation status, timing, and game outcome.
4. A stored match replays without a running model and reaches the recorded final state.
5. Provider failures and simulation fallbacks are unambiguous in the UI and results.
6. Core engine and provider-parser behavior are covered by automated tests; a production build remains clean.

## Risks and decisions to make early

| Risk | Mitigation |
| --- | --- |
| Small models routinely violate JSON instructions. | Keep the action contract tiny, validate strictly, retain raw output, and report repairs/fallbacks as a metric. |
| Inference latency makes live matches feel stalled. | Separate simulation playback from inference, allow fast replay, set timeouts, and foreground latency in model comparisons. |
| Prompt improvements overfit one opponent or seed. | Evaluate against a fixed scenario suite and report per-scenario results, not one dramatic match. |
| Local browser storage reaches its limit. | Store compact events by default, cap retained raw text with player controls, and support export/delete. |
| “Explainability” overpromises. | Use the three-layer model and label all heuristic/counterfactual analysis clearly. |
| Cross-origin local endpoints vary. | Document endpoint requirements, test connection/capabilities up front, and maintain a provider compatibility matrix. |

The only product decision needed before implementation is the initial evaluation philosophy: use a deterministic reference bot as the standard opponent, or allow both sides to be LLMs immediately. The recommended starting point is a reference bot plus configurable LLM sparring, because it yields a stable benchmark without giving up the spectacle of bot-versus-bot matches.
