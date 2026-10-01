import { useState } from 'react';
import { CheckCircle2, ChevronDown, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import type { DesignHealthReport } from '../cad/designHealth';

type Props = {
  report: DesignHealthReport;
};

export default function DesignHealthPanel({ report }: Props) {
  const [expanded, setExpanded] = useState(true);
  const visibleIssues = report.checks.filter(check => check.severity !== 'info').slice(0, 7);
  const significantIssueCount = report.checks.filter(check => check.severity !== 'info').length;

  return (
    <section className={`design-health-panel ${expanded ? 'expanded' : 'collapsed'} ${report.status}`}>
      <button
        className="design-health-summary"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(current => !current)}
      >
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
            {significantIssueCount > visibleIssues.length && (
              <small className="health-more">+{significantIssueCount - visibleIssues.length} more checks</small>
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
