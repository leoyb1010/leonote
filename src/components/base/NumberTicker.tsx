"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface NumberTickerProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export function NumberTicker({ value, format = (v) => v.toString(), className = "" }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(format(value));

  useEffect(() => {
    // Parse current display value back to number for the starting point
    // This is a bit naive if the format adds non-numeric chars, but works for simple numbers
    // A safer way is to keep a ref of the numeric value
    const startValue = parseFloat(displayValue.replace(/[^0-9.-]+/g, "")) || 0;
    
    const controls = animate(startValue, value, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1], // easeOutQuint
      onUpdate: (v) => {
        setDisplayValue(format(v));
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format]); // displayValue is intentionally omitted to avoid loops

  return <span className={className}>{displayValue}</span>;
}
