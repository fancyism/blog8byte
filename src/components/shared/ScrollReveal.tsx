"use client";

/**
 * ScrollReveal - Reusable wrapper for scroll-triggered animations.
 *
 * The rendered element must stay identical during SSR and hydration,
 * so this component avoids browser-dependent render branches.
 */

import { type ReactNode } from "react";
import { motion } from "motion/react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 24,
  once = true,
}: ScrollRevealProps) {
  const offset =
    direction === "up"
      ? { y: distance }
      : direction === "down"
        ? { y: -distance }
        : direction === "left"
          ? { x: distance }
          : { x: -distance };

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-72px" }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
