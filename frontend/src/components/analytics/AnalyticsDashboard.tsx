"use client"

import useSWR from 'swr';
import { VolumeStatCards } from './VolumeStatCards';
import { FrictionBarList } from './FrictionBarList';
import { SentimentAreaChart } from './SentimentAreaChart';
import { Loader2 } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AnalyticsDashboard() {
  const { data, error, isLoading } = useSWR(buildApiUrl('analyticsDaily'), fetcher, {
    refreshInterval: 60000 // Refresh every minute
  });

  if (error) return <div className="text-red-400 p-8 text-center bg-zinc-950 rounded-2xl border border-red-500/20">Failed to load analytics engine.</div>;
  if (isLoading) return (
    <div className="flex items-center justify-center h-64 w-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  const rawSummaries = data?.timeline || [];
  
  // Format timelines
  const timelineData = rawSummaries.map((s: any) => {
      const date = new Date(s.timeWindow);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
          time: timeStr,
          sentiment: s.frictionData.avg_sentiment || 0
      };
  });

  // Calculate volume globally
  let globalCount = 0;
  rawSummaries.forEach((s: any) => {
     const issues = s.frictionData.top_issues || [];
     issues.forEach((i: any) => { globalCount += i.count || 0; });
  });

  const daily = data?.today || {};
  const currentSentiment = daily.avgSentiment !== undefined ? daily.avgSentiment : 0;
  const currentIssues = daily.topIssues || [];

  return (
    <div className="space-y-6">
      <VolumeStatCards sentiment={currentSentiment} interactions={globalCount} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <FrictionBarList data={currentIssues} />
         <SentimentAreaChart data={timelineData} />
      </div>
    </div>
  );
}
