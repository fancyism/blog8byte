"use client";

/**
 * BlogGrid — Responsive grid with stagger scroll-reveal.
 */

import { type ReactNode } from "react";
import { ScrollReveal } from "~/components/shared/ScrollReveal";

interface BlogGridProps {
  children: ReactNode[];
}

export function BlogGrid({ children }: BlogGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * 0.08}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
