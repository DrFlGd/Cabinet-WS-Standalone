export type ViewportHandleKind = 'envelope' | 'shelf' | 'divider';

export function shouldShowViewportHandle(
  kind: ViewportHandleKind,
  partId: string | undefined,
  selectedId: string | null,
  envelopeEditActive: boolean,
) {
  if (kind === 'envelope') return envelopeEditActive;
  return Boolean(partId && selectedId && partId === selectedId);
}
