import { Card, CardContent } from "@/components/ui/card";
import { Activity, MessageSquare } from "lucide-react";

export function VolumeStatCards({ sentiment, interactions }: { sentiment: number, interactions?: number }) {
  const isPositive = sentiment >= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
         <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                 <p className="text-sm font-medium text-zinc-500">Total Analyzed Interactions</p>
                 <p className="text-3xl font-bold tracking-tight text-zinc-100">{interactions || "N/A"}</p>
                 <p className="text-xs text-zinc-500">Across current global rollup</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                 <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
         </CardContent>
      </Card>
      
      <Card className="bg-zinc-900 border-zinc-800">
         <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                 <p className="text-sm font-medium text-zinc-500">Average Global Sentiment</p>
                 <p className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sentiment !== undefined ? (sentiment > 0 ? '+' : '') + sentiment.toFixed(2) : "N/A"}
                 </p>
                 <p className="text-xs text-zinc-500">From Map-Reduce worker pipelines</p>
              </div>
              <div className={`p-3 rounded-xl ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                 <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
