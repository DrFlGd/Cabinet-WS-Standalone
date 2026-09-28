import { useCallback, useReducer } from 'react';
import {
  createHistoryState,
  historyReducer,
  type EditorDocument,
} from './history';

export function useDocumentHistory(initial: EditorDocument) {
  const [state, dispatch] = useReducer(historyReducer, initial, createHistoryState);

  const edit = useCallback((
    apply: (current: EditorDocument) => EditorDocument,
    group?: string,
  ) => {
    dispatch({ type: 'edit', apply, group, now: Date.now() });
  }, []);

  const reset = useCallback((document: EditorDocument) => {
    dispatch({ type: 'reset', document });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    document: state.present,
    edit,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
