"use client";

import { useEffect } from "react";

export function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const sessionKey = `blog8byte:view:${slug}`;
    if (window.sessionStorage.getItem(sessionKey)) return;

    window.sessionStorage.setItem(sessionKey, "1");
    void fetch(`/api/blogs/${slug}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      window.sessionStorage.removeItem(sessionKey);
    });
  }, [slug]);

  return null;
}
