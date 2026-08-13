"use client";

import { TempsAnalyticsProvider } from "@temps-sdk/react-analytics";
import type { ReactNode } from "react";

import { hasTempsAnalytics } from "@/config/analytics";
import { useConsent } from "@/providers/consent";

export function TempsAnalytics({ children }: { children: ReactNode }) {
  const { allows } = useConsent();

  if (process.env.NODE_ENV !== "production") {
    return children;
  }

  if (!hasTempsAnalytics() || !allows("analytics")) {
    return children;
  }

  return (
    <TempsAnalyticsProvider
      basePath="/api/_temps"
      disabled={false}
      ignoreLocalhost={true}
      autoTrackPageviews={true}
      autoTrackPageLeave={true}
      autoTrackSpeedAnalytics={true}
      autoTrackEngagement={true}
      heartbeatInterval={30000}
      enableSessionRecording={false}
    >
      {children}
    </TempsAnalyticsProvider>
  );
}
