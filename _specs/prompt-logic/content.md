# The Logic of a Prompt: content spec

Owner: content team (Philosopher, Linguist, Science Communicator, Curriculum Designer, Ethicist).
Page data: `content.json` in this folder. The page renders all text from it. Run `python3 check.py` after any edit.
Audience: the general public. Curious adults, teenagers, people new to AI chatbots. No prior logic or AI knowledge assumed.
Language: English only, British spelling (colour, favourite, neighbour). Switching to American spelling is a find-and-replace job, but keep Grice's own petrol and garage example as it is.

## Thesis

Writing a good prompt uses the same logic as clear reasoning. A prompt is a small argument plus a request. You give premises (context), fix what you are talking about (scope), define your terms, set constraints, name the conclusion you want (goal), supply evidence, and test the reasoning. Every missing piece is something the model has to guess.

The honest corollary, stated early and again at the end: a well-structured prompt makes a useful answer more likely. It does not make the answer true.

## Learning objectives (observable)

After using the page, a reader can:

1. Look at a vague prompt, name at least one missing part, and say what the model had to guess because of it. (Checked by the "spot the missing piece" game.)
2. Rewrite a one-line request by adding at least context, scope and an objective, and explain what each addition changes. (Practised in the builder.)
3. Explain in their own words why a well-built argument, or prompt, can still reach a false conclusion: valid form with false premises gives confident nonsense. (The syllogism demo.)
4. Name two things they will do with any citation, quote or number a model gives them: trace it to a real source, and prefer sources they supplied themselves.
5. Match each of the 7 domains to the question it answers (Who is speaking, to whom? What is given? What is in and out? What is the goal? What backs it up? Where could it fail? What is still missing?). (The cheat sheet.)

## Misconceptions the page corrects

1. **"A good prompt guarantees a correct answer."** Structure raises the odds of a useful answer. It cannot make false premises true or stop a model inventing a fact. (Hero lede, syllogism, Limits 1.)
2. **"Longer is always better."** Grice's maxim of Quantity has two halves: say as much as is needed, and no more. Irrelevant detail is noise the model may treat as important. (Keywords pitfall, Scope, Basics: Grice.)
3. **"If I tell it to act as a doctor, I get a doctor's answer."** A role changes vocabulary, depth and angle. It adds no training, licence or accountability. (Act as pitfall, Limits 4.)
4. **"If the model gives a citation, quote or number, it must be real."** Invented references, misattributed quotes and made-up figures are a known failure. (Evidence parts, quiz round on statistics, Limits 2.)
5. **"The model knows what I mean."** It fills gaps with typical defaults. That is the "guess" line on every part card. (Every part, the quiz.)
6. **"Prompting is a set of magic words."** The parts are ordinary good communication. They would help a human assistant just as much. (Hero, Basics: Grice.)

## Narrative arc

### 1. Hero
`hero.kicker`, `hero.title`, `hero.lede`. One idea: a prompt is a small argument plus a request, and it can still be wrong. No illustration of a robot. A good visual is a single prompt sentence with its parts lightly underlined in the 7 domain colours, as a preview of what the page will teach.

### 2. Logic basics (8 ideas)
`basics[]`: premise, inference and conclusion, domain of discourse, definition and ambiguity, necessary and sufficient conditions, evidence and induction, counterexample, Grice's maxims.
Each card: term, plain words, an everyday example, and "in prompts" (the bridge sentence). Order matters: it walks from what you start with (premise) to where you land (conclusion), then to what can go wrong (ambiguity, weak induction, counterexamples), and ends on Grice, who connects logic to everyday requests.

**Syllogism demo** (`syllogism`) sits right after the premise and inference cards. Show the two premises and conclusion. One control swaps `premises[0]` for `brokenPremise`, and the conclusion changes to `brokenConclusion`. The form is identical and still valid; the premise is now false, so the conclusion is false. Show `note` beneath. Label the two states "valid and sound" and "valid, not sound". This is the page's key honesty lesson, so give it room.

Grice's maxims, for any tooltip or glossary use (from Grice 1975):
- Quantity: make your contribution as informative as required, and not more informative than required.
- Quality: try to make it true; do not say what you believe false or what you lack adequate evidence for.
- Relation: be relevant.
- Manner: be clear; avoid obscurity and ambiguity, be brief, be orderly.

Caveat for the page (one line, e.g. under the Grice card or in a footnote): Grice described conversations between people. Applying the maxims to a chatbot is a useful lens, not a claim that the model is a cooperative person.

### 3. The 7 domains and 21 parts
`domains[]` in order, each with its `parts` list. Part numbers `n` run 1 to 21 in this order.

| Domain | Logical idea | Parts |
|---|---|---|
| Frame | Speaker, listener and voice | Act as, Audience, Tone, Language |
| Premises | What is given, and defined | Context, Examples, Keywords, Terminology |
| Bounds | Domain of discourse and constraints | Scope, Limitations, Deadline, Format |
| Goal | The conclusion you want | Objective, Call to action |
| Evidence | Support for claims | Citations, Statistics, Quotes |
| Testing | Counterexamples and other standpoints | Points of view, Counterarguments, Analogies |
| Dialogue | Cooperation that closes the gaps | Questions |

We kept the owner's grouping. We considered moving Analogies to Evidence, since argument from analogy is a classic, weak, form of support. We rejected that move because it would suggest that an analogy proves something. Analogies stay in Testing: an analogy is tested by finding where it breaks, and that is how the page tells readers to use one.

Each part card shows: name, `line`, `logic`, `guess` ("if you leave it out, the model must guess..."), a weak/strong pair, `pitfall`, and a small maxim badge when `maxim` is not null.

**Weak and strong pairs.** Each pair differs only in the one part the card is about. The checker confirms that the strong version keeps every word of the weak one. Render the added words highlighted, e.g. by diffing the two strings. Each part uses its own everyday situation; no situation repeats.

**Maxim mapping.** Badges appear only where the link to Grice is direct. Eight parts are null on purpose: Act as, Tone, Examples, Limitations, Deadline, Call to action, Points of view, Counterarguments. We did not force a maxim onto them. Quality goes on the three Evidence parts. Relation goes on Context, Keywords, Scope and Objective: Grice tied relevance to the purpose of the exchange. Manner goes on Language, Terminology, Format and Analogies. (Tone was tagged Manner at first; the review removed it: Grice's Manner is about clarity, and politeness was a separate social maxim for him.) Quantity goes on Audience and Questions.

**Logic mapping notes (Philosopher's check):**
- Act as: a standpoint or perspective. It is not a premise and adds no knowledge.
- Audience: the shared background, the common ground the answer can assume.
- Tone: separates content (what is claimed) from expression (how it is said).
- Language: shared interpretation; avoids obscurity.
- Context: premises in the strict sense.
- Examples: induction from cases. The pattern the model infers is underdetermined.
- Keywords: subject terms, used as a relevance test. This is the loosest mapping and we say so lightly ("work as a relevance test").
- Terminology: definition against equivocation.
- Scope: domain of discourse. This is a direct mapping.
- Limitations: necessary conditions. We say explicitly that meeting them is not sufficient.
- Deadline: we say plainly that this is mostly pragmatic. The only logical content is a time index (claims true "as of" a date). The card and the builder treat it as "the time frame of the task or the information", never as a schedule the model works to.
- Format: a constraint on form, linked to "be orderly".
- Objective: the conclusion being argued toward.
- Call to action: a practical conclusion, a decision about what to do (as in the classical practical syllogism). We read the owner's term as the next step the output should end on, for the user or the user's readers.
- Citations, Statistics, Quotes: evidence. Statistics are induction over many cases; quotes are testimony.
- Points of view: testing a conclusion across standpoints.
- Counterarguments: counterexamples and falsification.
- Analogies: argument from analogy. It explains and suggests but never proves.
- Questions: dialogue that supplies missing premises instead of assuming them.

### 4. Interactive builder
`builder.tasks[]`, three everyday tasks: explain the Moon's phases to a child, plan a cheap weekend away, write a polite complaint about a washing machine.
Interaction: the user picks a task. They see the bare `base` request and 21 toggles grouped by domain. Each toggle on appends `fragments[partId]` after the base, in part order (`n`), joined with single spaces. Every fragment is a self-contained sentence, so any subset reads naturally. Suggested extras: a live word count; a "what the model must guess" list that shrinks as parts are added (from `parts[].guess`); a "copy prompt" button.
Honesty note to show near the builder: "More parts is not always better. Add the ones your task needs." (This is Quantity: not more than required.) The builder should not show a score that rises to 100% with all 21 parts on.
The evidence fragments model safe practice: they point to official sites, give ranges, ask for no invented numbers, and use quotes that the user pasted.

### 5. "Spot the missing piece" game
`quiz[]`, 8 rounds. Each round shows a vague prompt and the disappointing reply it got. The player picks the single most important missing part from 4 options, then sees `why`. The answers cover all 7 domains: audience, context, terminology, format, objective, statistics, counterarguments, questions. The distractors are chosen so that no other option is also clearly correct. For example, the dog round leaves out Context, and the workout round leaves out Limitations. If the page offers "show me the fixed prompt", it can link to that part's card.

### 6. Honest limits
`limits[]`, 5 cards: structure is not truth; sources can be invented; knowledge has a cutoff; a role is not a credential; you stay responsible. These are plain statements without hedging, and they are not hidden in a footnote. Place them before the cheat sheet so readers carry them away.

### 7. Cheat sheet
`cheatsheet[]`, 11 yes/no self-checks, one or two per domain. It should print well on one page: a printable card or a "copy as text" option. Ending on "Will I check every citation, quote and number?" is deliberate.

### Footer: sources
Render `sources[]` with title, author, year and a link. Entries with `verify: true` must be checked by the engineer or the owner before launch. Either hide them until checked or check them during the build.

## Ethics and accuracy notes (Ethicist and Chief Research Officer bar)
- The page names no AI product. It makes no claims of percentage improvement and cites no invented studies. Statements about model behaviour are kept general: models can invent citations, models tend to agree with the asker, models have a knowledge cutoff. Each is supported by a source in the list. Two of those sources are research papers marked verify.
- The numbers in examples are the user's own illustrative data, such as "200 pounds each" and "order number 48213". No example states a real-world statistic as fact.
- The black swan example: European observers long treated "all swans are white" as settled, until black swans were recorded in Australia. Popper uses swans to illustrate the point. This is safe as stated.
- The Moon fragment corrects a real, common misconception: phases are not caused by Earth's shadow, which causes eclipses.
- Health, legal, money and safety advice is pointed to qualified people in the Act as pitfall and in Limits 4 and 5.

## Sources

Confident:
- P. D. Magnus, *forall x: An Introduction to Formal Logic*, open textbook, https://www.fecundity.com/logic/
- H. P. Grice, "Logic and Conversation", in P. Cole and J. L. Morgan (eds.), *Syntax and Semantics 3: Speech Acts*, Academic Press, 1975, pp. 41-58.
- Karl Popper, *The Logic of Scientific Discovery*, Hutchinson, 1959 (German original 1934).
- Stanford Encyclopedia of Philosophy entries: Paul Grice (https://plato.stanford.edu/entries/grice/); Implicature (/entries/implicature/); Logical Consequence (/entries/logical-consequence/); Ambiguity (/entries/ambiguity/); Fallacies (/entries/fallacies/); Necessary and Sufficient Conditions (/entries/necessary-sufficient/); The Problem of Induction (/entries/induction-problem/); Karl Popper (/entries/popper/); Analogy and Analogical Reasoning (/entries/reasoning-analogy/).

Verify before launch:
- *forall x: Calgary*, Open Logic Project edition, https://forallx.openlogicproject.org/ (check URL and current edition).
- SEP "Definitions" (author list may now include a co-author).
- SEP "Epistemological Problems of Testimony" (author list).
- W. H. Walters and E. I. Wilder, "Fabrication and errors in the bibliographic citations generated by ChatGPT", *Scientific Reports* 13, 2023 (check citation details).
- M. Sharma et al., "Towards Understanding Sycophancy in Language Models", 2023, arXiv:2310.13548 (check ID).
- Anthropic, "Prompt engineering overview" (docs URL may have moved).
- OpenAI, "Prompt engineering" guide (URL may have moved).
The SEP author names in content.json reflect our best knowledge. Check them when adding links, since entries are revised over time.
