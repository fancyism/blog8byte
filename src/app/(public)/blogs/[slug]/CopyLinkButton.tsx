"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

/**
 * CopyLinkButton - Copies the current URL to the clipboard.
 */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          onClick={handleCopy}
          variant={copied ? "secondary" : "ghost"}
          size="sm"
        >
          {copied ? (
            <>
              <Check data-icon="inline-start" />
              คัดลอกแล้ว
            </>
          ) : (
            <>
              <Share2 data-icon="inline-start" />
              แชร์
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {copied ? "ลิงก์พร้อมส่งต่อแล้ว" : "คัดลอกลิงก์บทความ"}
      </TooltipContent>
    </Tooltip>
  );
}
