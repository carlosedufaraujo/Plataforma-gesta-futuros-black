'use client';

interface MetricData {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface MetricsGridProps {
  metrics: MetricData[];
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">{metric.value}</div>
          <div className={`metric-change ${metric.changeType}`}>
            {metric.change}
          </div>
        </div>
      ))}
    </div>
  );
} 