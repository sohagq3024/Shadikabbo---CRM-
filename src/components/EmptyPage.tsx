import React from 'react';

interface EmptyPageProps {
  title: string;
}

export const EmptyPage: React.FC<EmptyPageProps> = ({ title }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-[#181E54]">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">This section is currently reserved.</p>
      </div>

      {/* Kept empty as explicitly instructed: no fake widgets, charts, or tables */}
      <div className="min-h-[400px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
        <div className="text-center p-8">
          <p className="text-xs text-slate-400 font-medium">
            Page content will be configured in subsequent phase.
          </p>
        </div>
      </div>
    </div>
  );
};
