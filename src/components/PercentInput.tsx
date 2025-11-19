import React, { forwardRef, useState, useEffect } from "react";

interface PercentInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  ({ value, onChange, className = "", style, disabled = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(value.toString());
    const [isFocused, setIsFocused] = useState(false);

    // Update display value when prop value changes (but not while user is editing)
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value.toString());
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      // Allow empty string while typing
      if (inputValue === "" || inputValue === "-") {
        return;
      }

      const numValue = Number(inputValue);
      if (!isNaN(numValue)) {
        const clamped = Math.max(0, Math.min(100, numValue));
        onChange(clamped);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "" || inputValue === "-") {
        // If empty on blur, set to 0
        setDisplayValue("0");
        onChange(0);
      } else {
        const numValue = Number(inputValue);
        if (isNaN(numValue)) {
          setDisplayValue(value.toString());
        } else {
          const clamped = Math.max(0, Math.min(100, numValue));
          setDisplayValue(clamped.toString());
          onChange(clamped);
        }
      }
    };

    return (
      <input
        ref={ref}
        type="number"
        min={0}
        max={100}
        step="1"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          handleBlur(e);
        }}
        className={`percent-input-fixed ${className}`}
        style={{ 
          width: '100%',
          padding: '8px 10px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#111827',
          backgroundColor: disabled ? '#f3f4f6' : 'white',
          cursor: disabled ? 'not-allowed' : 'text',
          boxSizing: 'border-box',
          textAlign: 'right',
          fontFamily: 'monospace',
          ...style 
        }}
        disabled={disabled}
        {...props}
      />
    );
  }
);

PercentInput.displayName = "PercentInput";
