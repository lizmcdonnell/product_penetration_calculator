import React from "react";

interface ImportExportControlsProps {
  onReset: () => void;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
  onReset,
}) => {
  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={onReset}
        style={{
          padding: '6px 12px',
          height: '36px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        aria-label="Reset to defaults"
      >
        Reset
      </button>
    </div>
  );
};
