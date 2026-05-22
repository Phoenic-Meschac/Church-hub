"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({
  value,
  format,
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString("fr-FR")}</>;
}
