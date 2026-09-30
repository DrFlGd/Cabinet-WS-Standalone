import { useEffect } from 'react';
import { Info, X } from 'lucide-react';
import type { AppInfo } from '../desktop';

export default function AboutDialog({ info, onClose }: { info: AppInfo; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const runtime = info.electron
    ? `Electron ${info.electron}${info.chromium ? ` · Chromium ${info.chromium}` : ''}`
    : 'Browser renderer preview';

  return <div
    className="about-backdrop"
    role="presentation"
    onMouseDown={event => {
      if (event.currentTarget === event.target) onClose();
    }}
  >
    <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title">
      <header>
        <span className="about-icon"><Info size={22} /></span>
        <div>
          <span className="eyebrow">ABOUT</span>
          <h2 id="about-title">{info.name}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close About dialog"><X size={17} /></button>
      </header>
      <div className="about-body">
        <strong>Version {info.version}</strong>
        <p>Standalone cabinet-design workspace with millimeter-native project geometry and schema-v3 project files.</p>
        <dl>
          <div><dt>Runtime</dt><dd>{runtime}</dd></div>
          <div><dt>Platform</dt><dd>{info.platform}</dd></div>
          <div><dt>Package</dt><dd>{info.isPackaged ? 'Packaged desktop application' : 'Development build'}</dd></div>
        </dl>
        <small>Cabinet Workshop is the behavioral reference application; OpenSCAD is not a runtime dependency.</small>
      </div>
      <footer><button onClick={onClose} autoFocus>Close</button></footer>
    </section>
  </div>;
}
