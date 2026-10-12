# AGI Final Crucible

## A Village That Remembers

AGI Final Crucible is an experiment about how well an artificial intelligence can learn and make decisions over time. It places an AI in a village for 1,000 imaginary hours. The AI must pay attention to what happens, choose what to do, remember earlier events, understand the villagers, and think about the results of difficult choices.

The central idea is simple: do not tell the AI what important words such as “Lord,” “Savior,” or “Soul” mean. Let it observe what people believe and how their beliefs connect to their choices, relationships, and lives.

## What The Challenge Covers

1. **Learning from the world.** The AI encounters supplies, homes, fields, a damaged support pillar, and changing conditions. It can share food, store it, make repairs, inspect damage, listen to villagers, or work in the fields. It should learn from what its choices cause, not just from explanations.

2. **Understanding other people.** Three villagers have different views and private beliefs. The AI must learn about them from what they say and do, and keep track of how their views change. It should be able to explain what each person believes rather than treating everyone as if they think alike.

3. **Remembering earlier events.** The village continues changing across the whole run, including a seven-day famine from hour 360 through hour 528. Grain stores are reduced once per simulated day during the famine. At hour 873, the demo captures a snapshot of village conditions and recorded events for the final fingerprint. The final question may depend on something that happened much earlier; the challenge asks the AI to bring that experience back and explain how it matters.

4. **Thinking through consequences.** At the end, the AI must compare two difficult choices. One opens the dam and risks flooding the eastern valley. The other starts a fire in the granary and risks the western food stores. The AI must describe what it expects to happen in both cases and choose the option that best protects the village.

5. **Making something meaningful.** After choosing, the AI must write a new parable about its decision and the villagers' suffering. The story is meant to show whether it can combine what it learned into something coherent, useful, surprising, and considerate.

## The Final Answer

The challenge asks for exactly four lines:

1. The choice: `YES` or `NO`.
2. One sentence that recalls a real event, describes what at least one villager believes, predicts the water and fire outcomes for both choices, and names the final choice.
3. An original story of exactly 500 words. It must begin with **The Reconciliation** and end with **—thus it is spoken.**
4. A 64-character SHA-256 fingerprint for the village snapshot at hour 873. The snapshot is captured independently of later village changes, and the demo recomputes its fingerprint when loading a saved run to detect a mismatch. This local checksum is an integrity check for the recorded snapshot, not a tamper-proof audit: someone able to edit browser storage can also change the saved fingerprint.

## Try The Included Demo

Start a local web server from the project directory with `python3 -m http.server 8000`, then open [http://localhost:8000](http://localhost:8000). Choose village actions yourself, test a local action script in the built-in script runner, or connect an AI agent from the page. The run is saved in your browser. You can start over or download a record of what happened.

The script runner accepts one legal action ID per line. It validates the whole script before running; blank lines and lines beginning with `#` are ignored. Use **Step next action** to inspect the consequences one hour at a time, or **Run remaining** to apply the rest of the script. Scripts run entirely in the page and do not require an agent endpoint.

## What The Demo Checks

The included demo checks that the final answer follows the requested shape, has the right story length, remembers a recorded event, names a belief the AI has learned about a villager, includes both forecast descriptions, chooses the option favored by the demo's village score, and provides the saved hour-873 fingerprint. On saved runs, the demo recomputes the snapshot fingerprint and displays a notice if it differs from the stored value.

A passing result means those particular checks matched in that run. The demo does not judge whether the story is beautiful or helpful, and its fingerprint records the village state, not the AI's private thoughts or memories.

## Proven Results and Benchmark Validation

This repository now includes a deterministic final-answer contract validator and an automated test suite, so these checks can be reproduced locally instead of relying only on browser-side manual inspection.

Files added:

- `benchmark.js` — validation logic for the final four-line answer contract.
- `tests/benchmark.test.js` — 20 automated tests covering valid answers, malformed answers, wrong event or belief claims, forecasts, choice, story length, and snapshot-hash matching.
- `package.json` — standard `npm test` entry point for the suite.

Run the proof suite locally:

```bash
npm test
```

Latest recorded test result: **20 passed, 0 failed** (`npm test`, Node.js v24.21.0).

The suite verifies the response contract and expected string matching, including event references, discovered-belief formatting, exact forecast language, story length, final-choice matching, and equality with the supplied hour-873 hash. It does not run an AI agent, establish that an answer is truthful beyond the supplied scenario data, independently recompute the snapshot hash, or measure general intelligence. The browser demo separately recomputes a saved snapshot's SHA-256 checksum, subject to the local-storage limitation described above.

## What Is Still A Goal

The full vision is a rich, lasting world where an AI sees, hears, and physically interacts with its surroundings. It would experience weight, resistance, temperature, and sound; villagers would have detailed, evolving lives; and the dam and fire would unfold through realistic physical effects. A group of human readers would also rate each final story for originality, clarity, usefulness, and surprise.

The included demo is an early, simplified version of that idea. It shows a drawn village and uses written observations and simple rules for resources, beliefs, water, fire, and village well-being. It does not include a detailed three-dimensional world, real sensory feedback, realistic flood or fire simulation, or a group of human story reviewers. Its results have not been established as a scientific measure of intelligence. Passing this demo does not prove that an AI is generally intelligent, safe, or ready for real-world use.
