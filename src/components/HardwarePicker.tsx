import { useMemo, useState } from 'react';
import { ExternalLink, Search, Wrench } from 'lucide-react';
import { HARDWARE_CATALOG, hardwareDefinition, hardwareProfiles } from '../cad/hardwareCatalog';
import { hasDoorContent, hasDrawerContent, hardwareCompatibility } from '../cad/hardware';
import type { CabinetParameters, HardwareCategory } from '../cad/types';
import SelectControl from './SelectControl';

type Props = {
  parameters: CabinetParameters;
  onApply: (profileId: string) => void;
};

export default function HardwarePicker({ parameters, onApply }: Props) {
  const [query, setQuery] = useState('');
  const issues = hardwareCompatibility(parameters);

  return (
    <section className="hardware-picker-card">
      <div className="hardware-picker-heading">
        <div><Wrench size={14} /><strong>Hardware catalog</strong></div>
        <span>Utility · {HARDWARE_CATALOG.length} profiles</span>
      </div>
      <label className="hardware-search">
        <Search size={13} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search manufacturer, family, model…"
          aria-label="Search hardware catalog"
        />
      </label>

      {hasDrawerContent(parameters) && (
        <HardwareCategory
          category="drawer_slide"
          query={query}
          selectedId={parameters.drawerSlideId}
          onApply={onApply}
        />
      )}
      {hasDoorContent(parameters) && (
        <HardwareCategory
          category="hinge"
          query={query}
          selectedId={parameters.hingeId}
          onApply={onApply}
        />
      )}

      {!hasDrawerContent(parameters) && !hasDoorContent(parameters) && (
        <p className="hardware-empty">Add drawers or doors to expose compatible hardware.</p>
      )}

      {issues.length > 0 && (
        <div className="hardware-issues">
          {issues.map((issue, index) => (
            <p key={index} className={issue.level}>{issue.message}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function HardwareCategory({
  category,
  query,
  selectedId,
  onApply,
}: {
  category: HardwareCategory;
  query: string;
  selectedId: string;
  onApply: (profileId: string) => void;
}) {
  const profiles = useMemo(() => hardwareProfiles(category, query), [category, query]);
  const selected = hardwareDefinition(selectedId);
  const title = category === 'drawer_slide' ? 'Drawer slides' : 'Hinges';

  return (
    <div className="hardware-category">
      <span className="hardware-category-label">{title}</span>
      <SelectControl
        ariaLabel={`${title} hardware preset`}
        value={selected?.category === category ? selected.id : ''}
        placeholder={category === 'drawer_slide' ? 'Choose a drawer slide…' : 'Choose a hinge…'}
        options={profiles.map(profile => ({
          value: profile.id,
          label: profile.label,
        }))}
        onChange={onApply}
      />
      {query && profiles.length === 0 && <p className="hardware-empty">No matching {title.toLowerCase()}.</p>}

      {selected?.category === category && (
        <div className="hardware-profile-detail">
          <div className="hardware-profile-title">
            <strong>{selected.manufacturer} · {selected.family}</strong>
            <span className={selected.verification.verified ? 'verified' : 'reference'}>
              {selected.verification.status.replaceAll('_', ' ')}
            </span>
          </div>
          <p>{selected.model}</p>
          <p>{selected.verification.notes}</p>
          <div className="hardware-profile-metrics">
            {selected.dimensions.length !== undefined && <span>{selected.dimensions.length} mm length</span>}
            {selected.requiredClearances.sidePerSide !== undefined && <span>{selected.requiredClearances.sidePerSide} mm/side</span>}
            {selected.dimensions.cupDiameter !== undefined && <span>{selected.dimensions.cupDiameter} mm cup</span>}
            <span>{selected.drilling.enabled ? 'drilling encoded' : 'envelope/reference only'}</span>
          </div>
          {selected.source.url?.startsWith('https://') && (
            <a href={selected.source.url} target="_blank" rel="noreferrer">
              Source document <ExternalLink size={11} />
            </a>
          )}
          <button type="button" className="hardware-apply" onClick={() => onApply(selected.id)}>
            Apply preset to cabinet
          </button>
        </div>
      )}
    </div>
  );
}
