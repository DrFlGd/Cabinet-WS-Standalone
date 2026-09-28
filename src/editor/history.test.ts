import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS } from '../cad/cabinetModel';
import { createHistoryState, historyReducer, type EditorDocument } from './history';

const initial: EditorDocument = {
  name: 'Cabinet',
  displayUnits: 'mm',
  parameters: { ...DEFAULT_PARAMETERS },
};

describe('editor history', () => {
  it('undoes and redoes document edits', () => {
    let state = createHistoryState(initial);
    state = historyReducer(state, {
      type: 'edit',
      now: 1000,
      apply: current => ({ ...current, name: 'Renamed' }),
    });
    expect(state.present.name).toBe('Renamed');

    state = historyReducer(state, { type: 'undo' });
    expect(state.present.name).toBe('Cabinet');

    state = historyReducer(state, { type: 'redo' });
    expect(state.present.name).toBe('Renamed');
  });

  it('coalesces rapid edits to the same parameter into one undo step', () => {
    let state = createHistoryState(initial);
    state = historyReducer(state, {
      type: 'edit',
      group: 'parameter:width',
      now: 1000,
      apply: current => ({ ...current, parameters: { ...current.parameters, width: 800 } }),
    });
    state = historyReducer(state, {
      type: 'edit',
      group: 'parameter:width',
      now: 1200,
      apply: current => ({ ...current, parameters: { ...current.parameters, width: 850 } }),
    });

    expect(state.past).toHaveLength(1);
    expect(state.present.parameters.width).toBe(850);

    state = historyReducer(state, { type: 'undo' });
    expect(state.present.parameters.width).toBe(DEFAULT_PARAMETERS.width);
  });

  it('resets history at project boundaries', () => {
    let state = createHistoryState(initial);
    state = historyReducer(state, {
      type: 'edit',
      now: 1000,
      apply: current => ({ ...current, name: 'Changed' }),
    });
    state = historyReducer(state, {
      type: 'reset',
      document: { ...initial, name: 'Opened project' },
    });

    expect(state.present.name).toBe('Opened project');
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });
});
