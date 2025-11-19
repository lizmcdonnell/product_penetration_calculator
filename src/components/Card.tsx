import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <section 
    className={`rounded-lg bg-white border border-gray-200 ${className}`}
    style={{
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: className.includes('p-0') ? '0' : '1.5rem'
    }}
  >
    {className.includes('p-0') ? children : <div>{children}</div>}
  </section>
);

