import type { CabinetFamily, CabinetParameters, FamilyRecipeValues } from '../cad/types';
import type { DisplayUnits } from '../cad/units';

export type EditorDocument = {
  family: CabinetFamily;
  starterId: string | null;
  familyValues: FamilyRecipeValues;
  name: string;
  displayUnits: DisplayUnits;
  parameters: CabinetParameters;
};

export type HistoryState = {
  past: EditorDocument[];
  present: EditorDocument;
  future: EditorDocument[];
  lastGroup: string | null;
  lastEditAt: number;
};

export type HistoryAction =
  | { type: 'edit'; apply: (current: EditorDocument) => EditorDocument; group?: string; now: number }
  | { type: 'reset'; document: EditorDocument }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 100;
const GROUP_WINDOW_MS = 750;

export function cloneEditorDocument(document: EditorDocument): EditorDocument {
  return {
    family: document.family,
    starterId: document.starterId,
    familyValues: JSON.parse(JSON.stringify(document.familyValues)) as FamilyRecipeValues,
    name: document.name,
    displayUnits: document.displayUnits,
    parameters: { ...document.parameters },
  };
}

export function createHistoryState(document: EditorDocument): HistoryState {
  return {
    past: [],
    present: cloneEditorDocument(document),
    future: [],
    lastGroup: null,
    lastEditAt: 0,
  };
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'reset') return createHistoryState(action.document);

  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: cloneEditorDocument(previous),
      future: [cloneEditorDocument(state.present), ...state.future].slice(0, HISTORY_LIMIT),
      lastGroup: null,
      lastEditAt: 0,
    };
  }

  if (action.type === 'redo') {
    const next = state.future[0];
    if (!next) return state;
    return {
      past: [...state.past, cloneEditorDocument(state.present)].slice(-HISTORY_LIMIT),
      present: cloneEditorDocument(next),
      future: state.future.slice(1),
      lastGroup: null,
      lastEditAt: 0,
    };
  }

  const next = cloneEditorDocument(action.apply(cloneEditorDocument(state.present)));
  if (JSON.stringify(next) === JSON.stringify(state.present)) return state;

  const grouped = Boolean(
    action.group &&
    action.group === state.lastGroup &&
    action.now - state.lastEditAt <= GROUP_WINDOW_MS,
  );

  return {
    past: grouped
      ? state.past
      : [...state.past, cloneEditorDocument(state.present)].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    lastGroup: action.group ?? null,
    lastEditAt: action.now,
  };
}
