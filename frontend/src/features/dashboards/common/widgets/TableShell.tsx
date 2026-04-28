import React from "react";

interface Props {
  title:     string;
  subtitle:  string;
  children:  React.ReactNode;
  right?:    React.ReactNode;
}

// Layout wrapper for tabular data that provides a consistent header and responsive overflow behavior
const TableShell: React.FC<Props> = ({ title, subtitle, children, right }) => (
  <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      {/* Optional action area for global table controls like search or adding new records */}
      {right && <div className="shrink-0">{right}</div>}
    </div>
    
    {/* Ensure content is scrollable on small screens to maintain layout integrity */}
    <div className="overflow-x-auto p-4 md:p-6">{children}</div>
  </div>
);

export default TableShell;
