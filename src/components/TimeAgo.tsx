"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

type TimeAgoProps = {
  timestamp: Date | number | string;
};

export default function TimeAgo({ timestamp }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string | null>(null);

  useEffect(() => {
    if (timestamp) {
      setTimeAgo(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    }
  }, [timestamp]);

  if (!timeAgo) {
    return (
      <span className="inline-block h-4 w-24 animate-pulse rounded-md bg-muted align-middle" />
    );
  }

  return <span>{timeAgo}</span>;
}
