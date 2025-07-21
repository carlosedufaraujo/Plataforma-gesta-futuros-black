'use client';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
} 