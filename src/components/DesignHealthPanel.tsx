import { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, ChevronDown, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import type { DesignHealthReport } from '../cad/designHealth';
import { solveFit, type FitSolution, type FitTarget } from '../cad/fitSolver';
import { stockThickness } from '../cad/cabinetModel';
import type { CabinetParameters } from '../cad/types';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type Props = {
  report: DesignHealthReport;
  parameters: CabinetParameters;
  units: DisplayUnits;
  onApplySolution: (solution: FitSolution) => void;
};

type SolverMode = FitTarget['mode'];

export default function DesignHealthPanel({
  report,
  parameters,
  units,
  onApplySolution,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [solverMode, setSolverMode] = useState<SolverMode>('drawer');
  const [drawerWidth, setDrawerWidth] = useState(() => initialDrawerWidth(parameters));
  const [drawerDepth, setDrawerDepth] = useState(() => Math.max(100, parameters.depth - 120));
  const [equipmentWidth, setEquipmentWidth] = useState(() => Math.max(100, parameters.width - 120));
  const [equipmentHeight, setEquipmentHeight] = useState(() => Math.max(100, parameters.height - 180));
  const [equipmentDepth, setEquipmentDepth] = useState(() => Math.max(100, parameters.depth - 80));
  const [sideClearance, setSideClearance] = useState(25);
  const [verticalClearance, setVerticalClearance] = useState(25);
  const [depthClearance, setDepthClearance] = useState(40);
  const [moduleAxis, setModuleAxis] = useState<'width' | 'height'>('width');
  const [modulePitch, setModulePitch] = useState(32);
  const [moduleCount, setModuleCount] = useState(18);
  const [moduleMargin, setModuleMargin] = useState(16);

  const target: FitTarget = solverMode === 'drawer'
    ? { mode: 'drawer', insideWidth: drawerWidth, insideDepth: drawerDepth }
    : solverMode === 'equipment'
      ? {
          mode: 'equipment',
          equipmentWidth,
          equipmentHeight,
          equipmentDepth,
          sideClearance,
          verticalClearance,
          depthClearance,
        }
      : {
          mode: 'modules',
          axis: moduleAxis,
          pitch: modulePitch,
          count: moduleCount,
          margin: moduleMargin,
        };

  const solution = useMemo(() => solveFit(parameters, target), [
    parameters,
    solverMode,
    drawerWidth,
    drawerDepth,
    equipmentWidth,
    equipmentHeight,
    equipmentDepth,
    sideClearance,
    verticalClearance,
    depthClearance,
    moduleAxis,
    modulePitch,
    moduleCount,
    moduleMargin,
  ]);

  const visibleIssues = report.checks.filter(check => check.severity !== 'info').slice(0, 7);

  return (
    <section className={`design-health-panel ${expanded ? 'expanded' : 'collapsed'} ${report.status}`}>
      <button className="design-health-summary" type="button" onClick={() => setExpanded(current => !current)}>
        <StatusIcon status={report.status} />
        <span>
          <strong>Design Health · {report.status.toUpperCase()}</strong>
          <small>
            {report.summary.errorCount} errors · {report.summary.warningCount} warnings · manufacturing {report.readiness}
          </small>
        </span>
        <ChevronDown size={14} className={expanded ? 'open' : ''} />
      </button>

      {expanded && (
        <div className="design-health-content">
          <section className="health-issues">
            <div className="design-health-section-heading">
              <ShieldCheck size={13} />
              <strong>Current design</strong>
              <span>{report.readiness}</span>
            </div>

            {visibleIssues.length ? visibleIssues.map(check => (
              <article key={check.id} className={`health-check ${check.severity}`}>
                <div>
                  <strong>{check.title}</strong>
                  <small>{check.category}</small>
                </div>
                <p>{check.message}</p>
                {check.suggestion && <em>{check.suggestion}</em>}
              </article>
            )) : (
              <div className="health-pass">
                <CheckCircle2 size={15} />
                <p>No errors or warnings in the checked semantic scope.</p>
              </div>
            )}
            {report.checks.filter(check => check.severity !== 'info').length > visibleIssues.length && (
              <small className="health-more">+{report.checks.filter(check => check.severity !== 'info').length - visibleIssues.length} more checks</small>
            )}

            <details className="health-coverage">
              <summary>Validation coverage</summary>
              {report.coverage.map(item => (
                <div key={item.id}>
                  <span className={item.status}>{item.status}</span>
                  <p><strong>{item.label}</strong><small>{item.detail}</small></p>
                </div>
              ))}
            </details>
          </section>

          <section className="fit-solver">
            <div className="design-health-section-heading">
              <Calculator size={13} />
              <strong>Fit Solver</strong>
              <span>undoable apply</span>
            </div>

            <div className="fit-mode-tabs">
              {([
                ['drawer', 'Drawer'],
                ['equipment', 'Equipment'],
                ['modules', 'Modules'],
              ] as const).map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  className={solverMode === mode ? 'active' : ''}
                  onClick={() => setSolverMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>

            {solverMode === 'drawer' && (
              <div className="fit-input-grid">
                <FitDimension label="Inside width" value={drawerWidth} units={units} onChange={setDrawerWidth} />
                <FitDimension label="Inside depth" value={drawerDepth} units={units} onChange={setDrawerDepth} />
              </div>
            )}

            {solverMode === 'equipment' && (
              <>
                <div className="fit-input-grid">
                  <FitDimension label="Equipment W" value={equipmentWidth} units={units} onChange={setEquipmentWidth} />
                  <FitDimension label="Equipment H" value={equipmentHeight} units={units} onChange={setEquipmentHeight} />
                  <FitDimension label="Equipment D" value={equipmentDepth} units={units} onChange={setEquipmentDepth} />
                  <FitDimension label="Side clear." value={sideClearance} units={units} onChange={setSideClearance} />
                  <FitDimension label="Vertical clear." value={verticalClearance} units={units} onChange={setVerticalClearance} />
                  <FitDimension label="Depth clear." value={depthClearance} units={units} onChange={setDepthClearance} />
                </div>
              </>
            )}

            {solverMode === 'modules' && (
              <div className="fit-input-grid">
                <label>
                  <span>Axis</span>
                  <SelectControl
                    ariaLabel="Module solve axis"
                    value={moduleAxis}
                    options={[
                      { value: 'width', label: 'Width' },
                      { value: 'height', label: 'Height' },
                    ]}
                    onChange={value => setModuleAxis(value as 'width' | 'height')}
                  />
                </label>
                <FitDimension label="Pitch" value={modulePitch} units={units} onChange={setModulePitch} />
                <label>
                  <span>Count</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={moduleCount}
                    onChange={event => setModuleCount(Math.max(1, Math.round(event.currentTarget.valueAsNumber || 1)))}
                  />
                </label>
                <FitDimension label="Margin" value={moduleMargin} units={units} onChange={setModuleMargin} />
              </div>
            )}

            <div className={`fit-solution ${solution.feasible ? '' : 'infeasible'}`}>
              <div className="fit-solution-title">
                <strong>{solution.title}</strong>
                <span>{solution.feasible ? 'solved' : 'needs review'}</span>
              </div>
              <div className="fit-achieved">
                {Object.entries(solution.achieved).map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{typeof value === 'number' ? `${formatDimension(value, units)} ${unitLabel(units)}` : value}</strong>
                  </div>
                ))}
              </div>
              <details>
                <summary>How this result was calculated</summary>
                {solution.explanation.map((line, index) => <p key={index}>{line}</p>)}
              </details>
              {solution.warnings.map((warning, index) => <p className="fit-warning" key={index}>{warning}</p>)}
              <button
                type="button"
                className="fit-apply"
                disabled={!solution.feasible}
                onClick={() => onApplySolution(solution)}
              >
                Apply solved result
              </button>
              <small>Applying the result changes cabinet parameters as one undoable operation. Design Health immediately rechecks the result.</small>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function StatusIcon({ status }: { status: DesignHealthReport['status'] }) {
  if (status === 'error') return <XCircle size={16} />;
  if (status === 'warning') return <TriangleAlert size={16} />;
  return <CheckCircle2 size={16} />;
}

function FitDimension({
  label,
  value,
  units,
  onChange,
}: {
  label: string;
  value: number;
  units: DisplayUnits;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <DimensionInput value={value} units={units} min={0} step={1} onChange={value => onChange(Math.max(0, value))} />
    </label>
  );
}

function initialDrawerWidth(parameters: CabinetParameters) {
  const carcass = stockThickness(parameters.carcassStock, parameters.materialThickness);
  const clearance = parameters.drawerMount === 'metal_slides'
    ? Math.max(3, parameters.metalSlideClearancePerSide)
    : 10;
  const frame = parameters.faceFrameStyle === 'full' ? parameters.faceFrameCenterStileWidth : 0;
  return Math.max(
    100,
    parameters.width - 2 * carcass - frame - 2 * clearance - 2 * parameters.drawerMaterialThickness,
  );
}
