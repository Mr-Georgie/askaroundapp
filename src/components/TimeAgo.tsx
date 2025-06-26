"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

type TimeAgoProps = {
  timestamp: Date | number | string;
};

export default function TimeAgo({ timestamp }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState("");

  // We only want to format the date on the client side to avoid hydration mismatches.
  useEffect(() => {
    if (timestamp) {
      setTimeAgo(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    }
  }, [timestamp]);

  // Render a placeholder or nothing until the client-side has rendered.
  // Returning null would work, but an empty span prevents layout shifts if it's inside a flex container.
  if (!timeAgo) {
    // Skeleton loader to prevent layout shifts and provide a better UX.
    return (
      <span className="inline-block h-4 w-24 animate-pulse rounded-md bg-muted align-middle" />
    );
  }

  return <span>{timeAgo}</span>;
}
