import React from "react";

interface TotalBadgeProps {
  total: number;
}

export const TotalBadge: React.FC<TotalBadgeProps> = ({ total }) => {
  const valid = Math.abs(total - 100) < 0.1;
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: '600',
        color: valid ? '#059669' : '#d97706'
      }}
    >
      {total.toFixed(1)}%
    </span>
  );
};

