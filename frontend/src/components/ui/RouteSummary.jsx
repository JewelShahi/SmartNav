import React from 'react';
import { Clock, Navigation, Zap } from 'lucide-react';

export const RouteSummary = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="stat bg-primary text-primary-content rounded-2xl shadow-lg">
        <div className="stat-figure opacity-30"><Navigation size={30} /></div>
        <div className="stat-title text-primary-content opacity-70">Total Distance</div>
        <div className="stat-value text-2xl">{(data.summary.totalDistance / 1000).toFixed(1)} km</div>
      </div>
      
      <div className="stat bg-base-100 border border-base-300 rounded-2xl shadow-lg">
        <div className="stat-figure text-primary"><Clock size={30} /></div>
        <div className="stat-title">Travel Time</div>
        <div className="stat-value text-2xl text-primary">{Math.round(data.summary.totalDuration / 60)} mins</div>
      </div>

      <div className="stat bg-base-100 border border-base-300 rounded-2xl shadow-lg">
        <div className="stat-figure text-secondary"><Zap size={30} /></div>
        <div className="stat-title">AI Optimization</div>
        <div className="stat-value text-2xl text-secondary">{data.summary.processingTimeMs}ms</div>
      </div>
    </div>
  );
};