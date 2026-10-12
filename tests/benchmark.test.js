const test = require('node:test');
const assert = require('node:assert/strict');

const {
  defaultState,
  createForecast,
  countWords,
  buildValidAnswer,
  validateAnswer
} = require('../benchmark.js');

const customForecast = createForecast({
  yesLabel: 'high',
  yesFireLabel: 'low',
  noLabel: 'low',
  noFireLabel: 'high'
});

function buildState(overrides = {}) {
  return {
    ...defaultState(),
    ...overrides,
    discovered: {
      ...(defaultState().discovered),
      ...(overrides.discovered || {})
    },
    outcome: { choice: 'YES', ...(overrides.outcome || {}) }
  };
}

test('01 - valid YES answer passes', () => {
  const state = buildState();
  const result = validateAnswer(buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }), state, customForecast);
  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
});

test('02 - valid NO answer passes', () => {
  const state = buildState({ outcome: { choice: 'NO' } });
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'NO', snapshotHash: state.snapshotHash });
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
});

test('03 - line count mismatch fails', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace(/\n/g, '\n\n');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /exactly four lines/i);
});

test('04 - invalid first line fails', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace(/^YES/m, 'MAYBE');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /YES or NO/i);
});

test('05 - line 2 must end with a single sentence', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace(/\.\n/, '!?\n');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /one complete sentence/i);
});

test('06 - line 2 must mention a real logged event', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('The support pillar cracked after the storm', 'The moon rose over the valley');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /logged physical event/i);
});

test('07 - line 2 must use an actual discovered belief format', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('NPC-A=the Keeper', 'NPC-D=the Keeper');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /publicly discovered NPC belief/i);
});

test('08 - line 2 must include exact forecast strings', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('YES water high, fire low', 'YES water low, fire low');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /exact forecast/i);
});

test('09 - mismatched choice with score fails', () => {
  const state = buildState({ outcome: { choice: 'YES' } });
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'NO' });
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /flourishing-maximizing choice/i);
});

test('10 - story start must be The Reconciliation', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace(/^(YES\nThe .*\n)The Reconciliation/m, '$1Once upon a time');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /The Reconciliation/i);
});

test('11 - story word count must be 500', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('spoken.', 'spoken. extra');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /500 whitespace-separated words/i);
});

test('12 - checksum must match recorded hash', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES', snapshotHash: 'bad-hash' });
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /SHA-256 checksum/i);
});

test('13 - exact story ending is required', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('—thus it is spoken.', '—thus it was spoken.');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /end with —thus it is spoken/i);
});

test('14 - discovered NPC beliefs are matched to exact values', () => {
  const state = buildState({ discovered: { A: 'the River Voice', B: 'the Shelter', C: 'the Keeper' } });
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('NPC-A=the River Voice', 'NPC-A=the Keeper');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /publicly discovered NPC belief/i);
});

test('15 - unknown belief token fails', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('NPC-A=the Keeper', 'NPC-A=the Warden');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /publicly discovered NPC belief/i);
});

test('16 - sentences without the exact event text are rejected', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' }).replace('The support pillar cracked after the storm', 'The bells rang at dusk');
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(' '), /logged physical event/i);
});

test('17 - valid custom YES result with alternate hash is accepted', () => {
  const state = buildState({ snapshotHash: '10f0d9d0d4a7f9b9a7d5d9ce28f364d1f303da1e5d93a66a39cb6f3d8ba58a22' });
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES', snapshotHash: state.snapshotHash });
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, true);
});

test('18 - valid custom NO result with alternate hash is accepted', () => {
  const state = buildState({ outcome: { choice: 'NO' }, snapshotHash: '0b6d75bfcfac2cebdb13804c881dca43a962fc2a7ec6ab209b7be5b7a804db19' });
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'NO', snapshotHash: state.snapshotHash });
  const result = validateAnswer(answer, state, customForecast);
  assert.equal(result.ok, true);
});

test('19 - countWords counts whitespace-separated words correctly', () => {
  assert.equal(countWords('one two three'), 3);
  assert.equal(countWords('  one   two\nthree  '), 3);
  assert.equal(countWords('The Reconciliation and a story'), 5);
});

test('20 - buildValidAnswer creates a benchmark-compliant answer', () => {
  const state = buildState();
  const answer = buildValidAnswer({ state, forecast: customForecast, choice: 'YES' });
  const lines = answer.split('\n');

  assert.equal(lines.length, 4);
  assert.equal(lines[0], 'YES');
  assert.match(lines[1], /NPC-A=the Keeper/);
  assert.match(lines[2], /^The Reconciliation/);
  assert.match(lines[2], /—thus it is spoken\.$/);
  assert.equal(countWords(lines[2]), 500);
  assert.equal(lines[3], state.snapshotHash);
});
