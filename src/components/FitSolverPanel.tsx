import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { solveFit, type FitSolution, type FitTarget } from '../cad/fitSolver';
import { stockThickness } from '../cad/cabinetModel';
import type { CabinetParameters } from '../cad/types';
import { formatDimension, unitLabel, type DisplayUnits } from '../cad/units';
import DimensionInput from './DimensionInput';
import SelectControl from './SelectControl';

type Props = {
  parameters: CabinetParameters;
  units: DisplayUnits;
  onApplySolution: (solution: FitSolution) => void;
};

type SolverMode = FitTarget['mode'];

export default function FitSolverPanel({
  parameters,
  units,
  onApplySolution,
}: Props) {
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

  return (
    <section className="fit-solver-panel" aria-label="Fit Solver">
      <div className="fit-solver-heading">
        <span>
          <Calculator size={14} />
          <strong>Fit Solver</strong>
        </span>
        <small>Inputs stay available while switching workspace tabs. Applying a feasible result is one undoable edit.</small>
      </div>

      <div className="fit-solver-scroll">
        <div className="fit-mode-tabs" role="tablist" aria-label="Fit target">
          {([
            ['drawer', 'Drawer'],
            ['equipment', 'Equipment'],
            ['modules', 'Modules'],
          ] as const).map(([mode, label]) => (
            <button
              type="button"
              role="tab"
              aria-selected={solverMode === mode}
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
          <div className="fit-input-grid">
            <FitDimension label="Equipment W" value={equipmentWidth} units={units} onChange={setEquipmentWidth} />
            <FitDimension label="Equipment H" value={equipmentHeight} units={units} onChange={setEquipmentHeight} />
            <FitDimension label="Equipment D" value={equipmentDepth} units={units} onChange={setEquipmentDepth} />
            <FitDimension label="Side clear." value={sideClearance} units={units} onChange={setSideClearance} />
            <FitDimension label="Vertical clear." value={verticalClearance} units={units} onChange={setVerticalClearance} />
            <FitDimension label="Depth clear." value={depthClearance} units={units} onChange={setDepthClearance} />
          </div>
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
      </div>
    </section>
  );
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
