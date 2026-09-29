import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import type { CabinetParameters } from '../cad/types';
import HardwarePicker from './HardwarePicker';

type Props = {
  parameters: CabinetParameters;
  expanded: boolean;
  onToggle: () => void;
  onApply: (profileId: string) => void;
};

export default function HardwareDrawer({
  parameters,
  expanded,
  onToggle,
  onApply,
}: Props) {
  if (!expanded) {
    return (
      <aside className="panel hardware-drawer collapsed">
        <button
          type="button"
          className="hardware-drawer-toggle collapsed"
          onClick={onToggle}
          aria-label="Open hardware catalog"
          title="Open hardware catalog"
        >
          <ChevronLeft size={14} />
          <span>Hardware</span>
          <Wrench size={17} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="panel hardware-drawer expanded">
      <div className="panel-heading hardware-drawer-heading">
        <button
          type="button"
          className="icon-button subtle hardware-drawer-collapse"
          onClick={onToggle}
          aria-label="Collapse hardware catalog"
          title="Collapse hardware catalog"
        >
          <ChevronRight size={14} />
        </button>
        <Wrench size={17} />
        <div>
          <strong>Hardware</strong>
          <span>Catalog & presets</span>
        </div>
      </div>
      <div className="hardware-drawer-scroll">
        <HardwarePicker parameters={parameters} onApply={onApply} showHeading={false} />
      </div>
    </aside>
  );
}
