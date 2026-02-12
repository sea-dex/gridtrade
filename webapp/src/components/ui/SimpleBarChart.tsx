'use client';

interface SimpleBarChartProps {
  data: { date: string; [key: string]: string | number }[];
  dataKey: string;
  color: string;
}

export function SimpleBarChart({ data, dataKey, color }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d[dataKey] as number));

  return (
    <div className="flex items-end gap-1.5 h-44">
      {data.map((item, index) => {
        const height = ((item[dataKey] as number) / maxValue) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-t-sm ${color} transition-all duration-200 hover:opacity-75`}
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] text-(--text-disabled)">
              {item.date.split('-')[1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
