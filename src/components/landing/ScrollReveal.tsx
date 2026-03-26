"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;        // ms
  duration?: number;     // ms
  direction?: Direction;
  distance?: number;     // px
  once?: boolean;        // animate only once (default true)
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 600,
  direction = "up",
  distance = 32,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: sempre mostra após 1.5s, mesmo que o observer falhe
    const fallback = setTimeout(() => setVisible(true), 1500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          clearTimeout(fallback);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      // threshold:0 = qualquer pixel visível dispara; rootMargin antecipa 100px
      { threshold: 0, rootMargin: "0px 0px 100px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [once]);

  const translate = {
    up:    `translateY(${distance}px)`,
    down:  `translateY(-${distance}px)`,
    left:  `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none:  "none",
  }[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : translate,
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
