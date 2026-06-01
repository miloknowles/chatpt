# Training Tracker — Design Doc

A personal tool for managing a complex prehab + strength + mobility program. The system tracks not just what exercises were done, but what *qualities* (trainable dimensions of the body) are being built, maintained, or neglected — and surfaces gaps before they become injuries.

This doc captures every design decision made so far. Sections are organized roughly in the order they were decided.

---

## Goals & non-goals

### What this system is for

- Maintaining visibility across many simultaneous prehab/strength goals without losing track of any one
- Distinguishing *building* qualities (active progression) from *maintaining* qualities (just don't lose it)
- Catching deficiencies — strength gaps that are likely future injuries
- Knowing when an exercise is "heavy enough" for the demands of the sport, vs. worth pushing further
- Mapping which exercises hit which qualities, including double/triple duty

### What this system is not for (in v1)

- Full periodized training plan (volume, intensity, taper)
- Aerobic quality tracking (base, threshold, VO2max) — handled by separate training plan
- Compliance dashboards or social features
- Generalization to other users — this is a personal tool

### Design priorities

- The schema *is* the insight — articulating qualities and their relationships clarifies training before any code runs
- Low-friction capture — if logging is too heavy, the system gets abandoned
- The dashboard is the only screen that does real work; everything else is data entry

---

## Three-layer model

Most training apps collapse three layers into one. This system separates them:

1. **Session execution** — log exercises, reps, weight, notes. Solved problem.
2. **Program structure** — what's in rotation this week/block, sequencing. Mostly solved.
3. **A model of the body** — what issues are being managed, what qualities are being trained, what exercises hit what, where the gaps are, when to progress, what "enough" looks like.

Layer 3 is what makes layers 1 and 2 useful. It's also the part no existing app provides, because it requires opinionated modeling of one specific person's situation.

---

## Schema

### Entities

```
Issue                — what's wrong or being managed
Quality              — what's being trained
ProgressionChain     — ordered exercises that progress a quality
Exercise             — a movement (gym, mobility, or cardio)
UserExerciseState    — where you are in each chain
Session              — a training block with logged exercises
Superset             — a named, ordered group of exercises within a session
Note                 — timestamped observation, optionally tagged
```

### Issue

What's wrong, what's being managed, or what's a known risk. Issues generate qualities.

```
Issue
  - name / description
  - status: active | watching | chronic-managed | resolved
  - confidence: high | medium | hypothesis
  - related_issues: list of {Issue ref, relationship: downstream_of | upstream_of | related_to}
  - related_qualities: list of Quality refs
  - first_noted, last_flared
  - notes
```

**Why confidence:** Issues range from clinical diagnoses (high) to framework-based working models like PRI patterns (hypothesis). The field reminds future-you (or a different PT) which is which.

**Why related_issues with relationship type:** Lets you model the AIC → knee valgus → ankle web. "Downstream of" carries different meaning than "related to."

**Issues can include strength gaps** — "calf capacity gap for marathon volume" is treated as an Issue. Strength gaps are basically future injuries waiting to happen under business as usual.

### Quality

A trainable dimension of the body — what exercises actually move.

```
Quality
  - name
  - region: ankle | foot | knee | hip | pelvis | trunk | shoulder | upper back | etc.
  - status: building | maintaining | inactive
  - touch_frequency_target: e.g., "daily", "3x/week", "2x/week"
  - last_touched: derived from session logs
  - standard: optional — what "done" or "enough" looks like
  - related_issues: list of Issue refs (the "why")
  - notes
```

**Status enum kept simple:** `building`, `maintaining`, `inactive`. The earlier four-state version (acquiring / consolidating / maintaining / at-standard) was more granularity than would actually be used day-to-day. `Inactive` is distinct from never-tracked — it means previously trained, currently dormant, may want surfacing for review.

**Qualities vs. exercises is the key separation.** Most apps only track exercises. When you swap skater squats for Bulgarian split squats, an exercise-only app thinks you stopped doing skater squats. A quality-layer app knows you're still hitting "single-leg hip stability" — just with a different tool. This is what makes gap detection work.

### Exercise

A movement. Same entity for strength, mobility, activation, and cardio — only the optional fields differ.

```
Exercise
  - name
  - types: refs to ExerciseType (mobility, activation, strength, coordination, etc.; can be custom)
  - qualities_hit: list of ExerciseQualityLink (see below)
  - default_load_rep_scheme (strength)
  - default_duration_distance_zone (cardio)
  - form cues, contraindications
  - notes
```

**Types and qualities are the useful exercise-library facets:** Exercise types organize the method. Trained qualities explain why the exercise is in the library and support substitution/gap detection. Body regions are kept as anatomical metadata on qualities, not as direct exercise tags.

**Cardio as exercise:** Running, biking, swimming are modeled as exercises rather than a separate entity. Easy run, long run, tempo run, strides each become "exercises" linked to qualities. This avoids parallel logging systems.

### ExerciseType / BodyRegion

User-owned taxonomy options. Exercise types filter and organize exercises directly. Body regions group qualities anatomically.

```
ExerciseType
  - name
  - description
  - display_color
  - sort_key
  - is_system

BodyRegion
  - name
  - description
  - display_color
  - sort_key
  - is_system
```

**Why tables instead of text arrays:** These values need stable IDs, sorting, custom user-created options, and many-to-many assignment without typo drift. Exercise type and quality assignments are separate bridge tables; body regions are referenced by qualities.

### ExerciseQualityLink

The connective tissue between exercises and qualities. Most exercises hit multiple qualities at varying doses.

```
ExerciseQualityLink
  - exercise
  - quality
  - dose: primary | secondary | incidental
  - source: theory | observed | both
  - notes: especially for observed effects — context, conditions, caveats
```

**Why dose levels:** A heel-elevated split squat is *primary* for dorsiflexion end-range loading and *secondary* for single-leg hip stability. If you mark it as hitting both equally, the dashboard tells you hip stability is fine when actually you've been getting it incidentally and it's drifting.

**Why source field:** Some exercise → quality links are mechanism-based (theory predicts this should work). Others are observed (you noticed your tibia rotates better the day after easy bike). Observed links are stronger evidence because they're validated on you specifically. The system shouldn't lose these findings.

### ProgressionChain

An ordered list of exercises that progress a single quality, easiest to hardest.

```
ProgressionChain
  - quality (the quality this chain progresses)
  - ordered_steps: list of Exercise refs
  - progression_criteria_per_step: rule for advancing (e.g., "3x8 clean form across 3 sessions")
```

**Variants as pointers:** An exercise is just an exercise. The progression chain is a relationship between exercises, not a property of one. A single exercise can sit in multiple chains.

**Chains are quality-specific:** A skater squat may appear in the "single-leg hip stability" chain and the "right knee tracking" chain as separate entries, because progression criteria might differ.

### UserExerciseState

Per-user state — where you are in each chain. Necessary because "current step" only has meaning relative to a chain.

```
UserExerciseState
  - exercise (ref)
  - chain (ref)
  - is_current: whether you're actively doing this version right now
```

### Session

A training block — typically pre-run, strength, run, bike, or swim. Contains supersets and/or standalone exercises.

```
Session
  - date
  - type: AM run | PM strength | mobility | pre-run | bike | swim | etc.
  - supersets: list of Superset refs (with logged performance)
  - standalone_exercises: list of Exercise refs (with logged performance)
  - subjective notes
```

### Superset

A named, ordered group of exercises within a session. Terminology borrowed from strength training. Covers traditional supersets (antagonist pairs), complexes (sequenced prep work), and circuits.

```
Superset
  - name
  - ordered_exercises: list of Exercise refs (with order index)
  - linked_qualities: qualities the superset as a whole serves
    (may include qualities not served by any single exercise but served by the combination)
  - notes: why the order matters, if it does
```

**Why the combination can hit qualities that individual exercises don't:** The AIC reset superset (foam roll → 90/90 hip shift → step-overs → wall sit → clam shells) does work as a sequence that no single component does alone.

### Note

A timestamped observation, optionally tagged. Captures signal that happens outside sessions — symptoms, insights, PT input, passing thoughts.

```
Note
  - timestamp
  - body: free text
  - tags: optional refs to Issue, Quality, Exercise, or body region
```

No `kind` field — too much friction at capture time. Just text + tags.

**Why this matters:** "Right calf felt ropy this morning" tagged to the right ankle Issue and the calf-capacity Quality lets the system show symptom history alongside exercise history when viewing that issue.

---

## Populated data (current state)

### Issues

| Issue | Status | Confidence | Related to | Notes |
|---|---|---|---|---|
| Right ankle: lateral sprain history + anterior lesion | active | high | upstream_of: knee valgus | Drives DF limitation, eversion weakness, proprioception deficit, calf bias |
| Right foot: high arch, limited pronation, poor ground conformity | active | high | related_to: ankle; upstream_of: knee valgus | Less ground contact area, worse stability base |
| Left AIC postural pattern | chronic-managed | hypothesis | upstream_of: knee valgus, hamstring coordination, overhead reach, swim asymmetry | Framework-based working model, not diagnostic |
| Right knee valgus under load | active | high | downstream_of: ankle, foot, AIC | Own watch-fors during single-leg work |
| Right hamstring coordination at speed | active | medium | downstream_of: AIC | Limiter on form below ~6:30/mi |
| Right hamstring tendinitis risk / history | watching | high | related_to: hamstring coordination | Recurrent, R-biased |
| Limited overhead reach (R-biased) | active | high | downstream_of: AIC | Affects swim catch |
| Forward head / shoulders from desk work | active | high | related_to: overhead reach | Actively pulling back via serratus wall slides, pulls |
| Calf capacity gap for marathon volume | watching | high | — | Future-injury risk under build, R-side especially |
| Posterior chain strength gap | watching | high | — | Needs a defensible threshold (hex bar DL ~1.5-2x BW) |
| Single-leg endurance gap | watching | medium | downstream_of: AIC, ankle | Form holds at lower volumes; question is week 18-20 |

### Qualities

| Quality | Status | Touch freq |
|---|---|---|
| Right ankle dorsiflexion under load | building | daily |
| Right ankle lateral strength | building | daily |
| Tibialis strength (both legs) | building | 3x/week |
| Calf capacity for marathon volume | building | 2-3x/week |
| AIC reset / pelvic repositioning | maintaining | daily (pre-session) |
| Scapular positioning (down and back) | building | daily |
| Shoulder mobility (general) | maintaining | daily |
| Thoracic rotation | building | daily |
| Hip ER strength / glute med / stability | building | 3x/week |
| Hamstring strength | building | 2-3x/week |
| Hamstring eccentric tolerance (R) | building | 2x/week |
| Posterior chain strength | building | 2x/week |
| Adductor strength | building | 2-3x/week |
| Right knee tracking and stability | building | 3x/week |
| Right quad activation/strength | building | daily |
| Trunk anti-rotation | maintaining | 2x/week |
| Vertical pull strength | building | 2x/week |
| Horizontal pull strength | maintaining | 2x/week |
| Upper body push | maintaining | 2-3x/week |
| Hip flexor strength | building | 2x/week |
| General arm strength | maintaining | 2x/week |
| Foot pronation capacity (R) | building (incidental) | — |
| Foot intrinsics | inactive | — |

**Notes on quality framing:**

- *Foot pronation capacity (R)* is "building" but only via incidental dose from the kneeling lunge. Different status semantics than primary-dose building.
- *Hip flexor strength* is trained for hip extension capacity, not isolated flexor strength. Stronger flexors → less reactive tightness → better extension.
- *Calf capacity* is distinct from end-range dorsiflexion-loaded calf raises. The quality is calf endurance under load with correct tibial alignment.
- *Hamstring strength* and *hamstring eccentric tolerance (R)* are split because progression criteria differ. Eccentric work for tendinopathy is a specific protocol, not just a variant.

### Pre-run session

```
Superset: Upper body prep
  - Shoulder CARs
  - Serratus wall slides

Superset: Right ankle/knee/foot prep
  - Roll right foot arch
  - Banded ankle DF against wall
  - Calf raises w/ lacrosse ball
  - Foam roll right tibia
  - Kneeling lunge over R foot with IR
  - Tibialis raises
  - [NEW] Band eversion

Superset: AIC reset
  - Foam roll left quad + right hamstring
  - 90-90 hip shift (5-10 breaths)
  - Foam roller step-overs (left hip)
  - Right leg wall sit
  - Superman clam shells
```

The pre-run touches 9 of 21 active qualities at meaningful dose. Skipping pre-run is a real quality-coverage miss, not just a warmup miss.

### Strength sessions (2-3x/week)

```
Superset: Lower body / hip
  - Bulgarian split squats (3x10, weight opposite hand)
  - KB squat on ramp (goblet, both legs)
  - Superman clam shells
  - Copenhagen planks
  - SL skater squats
  - SL banded hamstring bridges
  - Seated hip flexor raises
  - [NEW] SL calf raises, straight + bent knee, w/ tibial IR cue

Superset: Posterior chain  [NEW]
  - Hex bar deadlift (3x5, target 1.5-2x BW)
  - SL RDL (3x8/side, 3-sec eccentric)

Superset: Upper body
  - T-spine pushups
  - Single arm DB rows / cable pulls
  - Bicep curls
  - Pullups (banded if needed)
  - Side plank with top-leg abduction
```

### Cardio sessions

| Cardio "exercise" | Qualities hit (dose) | Source |
|---|---|---|
| Easy run | Calf capacity (secondary); R ankle DF (incidental); R knee tracking (incidental) | theory |
| Long run | Calf capacity (primary at volume); posterior chain endurance (secondary); foot/ankle durability test | theory |
| Tempo run | Calf capacity (secondary); R hamstring coordination at speed (primary if at goal MP) | theory |
| Strides | R hamstring coordination at speed (primary) | theory |
| Easy bike (with warmup) | R knee tracking (secondary); tibial rotation (secondary) | **observed** |
| Hard bike | Some posterior chain (incidental) | theory |
| Masters swim | None tracked currently | — |

**Observed link captured:** Easy bike with adequate warmup → noticeably better R tibial IR and knee tracking the day after. Doesn't hold if warmup is rushed. The "with adequate warmup" qualifier is load-bearing — the exercise is bike *done properly*.

### Aerobic qualities

Deliberately not modeled in v1. Aerobic base, threshold, and VO2max are tracked implicitly via the separate training plan (weekly volume, pace targets, etc.). The dashboard's job is to surface gaps in the orthopedic/movement system; the training plan handles aerobic prep.

---

## Gaps surfaced by the model (first pass)

The exercise → quality mapping immediately surfaced building qualities with insufficient coverage. Several of these were already intuited; the model confirmed and added a couple that weren't on the radar.

| Gap | Severity | Resolution |
|---|---|---|
| Calf capacity for marathon volume | high | SL calf raises with tibial IR cue, added to lower body superset |
| Vertical pull strength | high | Resume pullups (banded if needed), added to upper body superset |
| Hamstring eccentric tolerance (R) | medium-high | SL RDL with 3-sec eccentric, added to new posterior chain superset; Nordics as a later complement |
| Right ankle lateral strength | medium | Band eversion daily (in pre-run); side plank w/ abduction 2x/week (in upper body) |
| Posterior chain strength | high | Hex bar DL 3x5, target 1.5-2x BW, then drop to maintenance dose |

**This is the system doing its job before any code is written.** Articulating the schema and populating it with real data surfaced five concrete gaps with concrete fixes.

---

## Design decisions worth preserving

These came up in conversation and informed the schema. Capturing them so the reasoning isn't lost.

1. **Building vs. maintaining is the right primary distinction.** Maintaining is cheap (a few minutes, fold into existing movements). Building is expensive (daily attention, end-range loading, weeks-to-months patience). At any given time, only one or two qualities can be actively *built*; the rest must be in maintenance mode. If maintenance feels heavy, the list is wrong.

2. **Prep work counts as exercise.** Foam rolling, arch rolling, tissue prep — these are tracked exercises, not warmup fluff. Skipping them changes the quality of the loaded work that follows. They get logged.

3. **Sequencing matters when it matters.** The Superset entity exists because some exercise orders are load-bearing: inhibition → repositioning → consolidation under load is a coherent sequence; reordering breaks it.

4. **Observed effects > predicted effects.** When you notice an exercise → quality relationship from experience, that's stronger evidence than mechanism-based prediction. The source field on ExerciseQualityLink preserves this distinction.

5. **More issues isn't a bad thing.** Issues can be interlinked, redundant, downstream of each other. Better to model the same problem from multiple angles than to artificially collapse them.

6. **Strength gaps are issues.** Calf capacity gap, posterior chain gap, vertical pull gap — these are future injuries under business as usual. Treating them as issues (rather than as some separate "to-add" list) keeps them in the same field of view as active complaints.

7. **The "with adequate warmup" qualifier pattern.** Many exercises are only worth what they're worth when done correctly. The notes field should capture conditions, not just defaults. A half-assed bike session shouldn't earn credit for tibial rotation work it isn't doing.

8. **Maintenance burden has to be near-zero.** If updating the system is heavier than the value it returns, it'll be abandoned. The dashboard derives most of what's interesting from the session log; manual updates should be rare (status changes, new exercises, new qualities — not daily).

---

## What's not designed yet

- **Dashboard / views.** The screen that does the real work. What gets surfaced when, what the daily "what should I do" output looks like, how gaps are visualized.
- **Standards & progression criteria.** Defensible thresholds for each quality. The hex bar DL standard (1.5-2x BW for marathon prep) is sketched; most others aren't yet encoded.
- **Implementation choice.** React (local browser, build from scratch), Notion (low friction, less expressive), or spreadsheet (lowest friction, weakest dashboard). The schema is implementation-agnostic so far.
- **Multi-block planning.** The current model captures one block's rotation. Block transitions (week 10 reassessment, Block 2 design) aren't modeled — could be a v2 addition or could live outside the system in conversation/notes.
