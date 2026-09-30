import { useEffect, useRef } from 'react';
import { CircleHelp, X } from 'lucide-react';

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter(element => !element.hasAttribute('hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return <div
    className="help-backdrop"
    role="presentation"
    onMouseDown={event => {
      if (event.currentTarget === event.target) onClose();
    }}
  >
    <section
      ref={dialogRef}
      className="help-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      aria-describedby="help-intro"
    >
      <header>
        <span className="help-icon"><CircleHelp size={22} /></span>
        <div>
          <span className="eyebrow">VIEWER HELP</span>
          <h2 id="help-title">Model viewer controls</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close Help"><X size={17} /></button>
      </header>
      <div className="help-body">
        <p id="help-intro">Use the viewer to inspect parts, take measurements, and make supported direct edits.</p>

        <section>
          <h3>Navigate</h3>
          <dl>
            <div><dt>Rotate</dt><dd>Left-drag empty space or the model.</dd></div>
            <div><dt>Pan</dt><dd>Right-drag.</dd></div>
            <div><dt>Zoom</dt><dd>Mouse wheel or trackpad scroll.</dd></div>
            <div><dt>Views</dt><dd>Use Iso, Front, Right, Top, and Fit in the toolbar.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Select and edit</h3>
          <dl>
            <div><dt>Part / face</dt><dd>Click a model face. Face dimensions appear when detailed face data is available.</dd></div>
            <div><dt>Multiple parts</dt><dd>Ctrl-click (Command-click on macOS) to add or remove parts from the selection.</dd></div>
            <div><dt>Edge</dt><dd>Shift-click a visible edge when edge selection is available.</dd></div>
            <div><dt>Part actions</dt><dd>Right-click a part for Isolate, Hide, and Show all.</dd></div>
            <div><dt>Cabinet size</dt><dd>Edit W, H, and D in the viewer fields. Hold Alt to reveal the optional 3D size drag handles.</dd></div>
            <div><dt>Shelves / dividers</dt><dd>Select an adjustable shelf or section divider to reveal its direct drag handle.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Measure</h3>
          <dl>
            <div><dt>Face</dt><dd>Click a face for linear dimensions when the face supports them; area is shown as secondary information.</dd></div>
            <div><dt>Distance</dt><dd>Choose Distance, then select two faces or edges.</dd></div>
            <div><dt>Angle</dt><dd>Choose Angle, then select two faces.</dd></div>
            <div><dt>Units</dt><dd>Measurements follow the display unit selected in the toolbar.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Keyboard</h3>
          <dl>
            <div><dt>Save</dt><dd>Ctrl/Cmd+S. Use Ctrl/Cmd+Shift+S for Save As.</dd></div>
            <div><dt>Undo / redo</dt><dd>Ctrl/Cmd+Z; Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z.</dd></div>
            <div><dt>Close Help</dt><dd>Escape.</dd></div>
          </dl>
        </section>
      </div>
      <footer><button type="button" onClick={onClose} autoFocus>Close</button></footer>
    </section>
  </div>;
}
