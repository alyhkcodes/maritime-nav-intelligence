import { useEffect, useRef, useState } from 'react';

type Props = { value: number; duration?: number; decimals?: number };

export default function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
}: Props) {
  const [display, setDisplay] = useState(0);
  const start = useRef(Date.now());
  const from = useRef(0);

  useEffect(() => {
    from.current = display;
    start.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = from.current + (value - from.current) * ease;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}
