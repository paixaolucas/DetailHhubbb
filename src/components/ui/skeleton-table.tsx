"use client";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function SkeletonTable({ rows = 5, columns = 4, showHeader = true }: SkeletonTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px]">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <div className="h-4 bg-white/10 rounded animate-pulse w-24" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-t border-white/10">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div
                    className="h-4 bg-white/10 rounded animate-pulse"
                    style={{ width: colIdx === 0 ? "60%" : colIdx === columns - 1 ? "40%" : "80%" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
