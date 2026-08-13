/**
 * Consent is the load boundary for analytics. These tests mock the SDK itself
 * so a failure cannot contact Temps, then exercise the real consent provider
 * to prove the SDK is mounted only after an explicit current-version choice.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConsentProvider, useConsent } from "@/providers/consent";
import { GoogleAnalytics } from "@/providers/google-analytics";
import { TempsAnalytics } from "@/providers/temps-analytics";
import {
  ALLOW_ALL,
  CONSENT_COOKIE,
  DENY_ALL,
  serializeConsent,
} from "@/lib/consent";

const mocks = vi.hoisted(() => ({
  googleProvider: vi.fn(),
  tempsProvider: vi.fn(),
}));

vi.mock("@temps-sdk/react-analytics", () => ({
  TempsAnalyticsProvider: mocks.tempsProvider,
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: mocks.googleProvider,
}));

function ConsentControls() {
  const { acceptAll, ready, rejectAll, state } = useConsent();

  return (
    <>
      <span data-testid="consent-status">
        {ready ? (state ? "decided" : "absent") : "pending"}
      </span>
      <button onClick={acceptAll}>accept</button>
      <button onClick={rejectAll}>withdraw</button>
    </>
  );
}

function setConsent(state: typeof ALLOW_ALL | typeof DENY_ALL | null) {
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`;
  if (state) {
    document.cookie = `${CONSENT_COOKIE}=${serializeConsent(state)}; Path=/`;
  }
}

function renderAnalytics({ google = false }: { google?: boolean } = {}) {
  return render(
    <ConsentProvider>
      <ConsentControls />
      <TempsAnalytics>
        <div data-testid="app-content" />
      </TempsAnalytics>
      {google ? <GoogleAnalytics /> : null}
    </ConsentProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  delete process.env.NEXT_PUBLIC_PROJECT_SLUG;
  delete process.env.NEXT_PUBLIC_TEMPS_API_URL;
  delete process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  setConsent(null);

  mocks.tempsProvider.mockImplementation(({ children }) => (
    <div data-testid="temps-sdk">{children}</div>
  ));
  mocks.googleProvider.mockImplementation(() => (
    <div data-testid="google-sdk" />
  ));
});

afterEach(() => {
  setConsent(null);
  vi.unstubAllEnvs();
});

describe("TempsAnalytics", () => {
  it("does not mount the SDK when its public config is absent", async () => {
    setConsent(ALLOW_ALL);
    renderAnalytics();

    await waitFor(() =>
      expect(screen.getByTestId("consent-status")).toHaveTextContent("decided"),
    );
    expect(mocks.tempsProvider).not.toHaveBeenCalled();
    expect(screen.getByTestId("app-content")).toBeInTheDocument();
  });

  it.each(["development", "test"])(
    "does not mount the SDK in %s",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
      vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
      setConsent(ALLOW_ALL);
      renderAnalytics();

      await waitFor(() =>
        expect(screen.getByTestId("consent-status")).toHaveTextContent("decided"),
      );
      expect(mocks.tempsProvider).not.toHaveBeenCalled();
    },
  );

  it.each([null, DENY_ALL])(
    "does not mount without accepted analytics consent (%s)",
    async (consent) => {
      vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
      vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
      setConsent(consent);
      renderAnalytics();

      await waitFor(() =>
        expect(screen.getByTestId("consent-status")).toHaveTextContent(
          consent ? "decided" : "absent",
        ),
      );
      expect(mocks.tempsProvider).not.toHaveBeenCalled();
    },
  );

  it("mounts only the exact first-party, no-replay provider contract", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
    setConsent(ALLOW_ALL);
    renderAnalytics();

    await screen.findByTestId("temps-sdk");
    const props = mocks.tempsProvider.mock.calls[0]?.[0];
    expect(props).toMatchObject({
      basePath: "/api/_temps",
      disabled: false,
      autoTrackPageviews: true,
      autoTrackPageLeave: true,
      autoTrackSpeedAnalytics: true,
      autoTrackEngagement: true,
      heartbeatInterval: 30000,
      enableSessionRecording: false,
      ignoreLocalhost: true,
    });
    expect(props).not.toHaveProperty("projectId");
    expect(props.enableSessionRecording).toBe(false);
  });

  it("unmounts the SDK as soon as consent is withdrawn", async () => {
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
    setConsent(ALLOW_ALL);
    renderAnalytics();

    await screen.findByTestId("temps-sdk");
    await user.click(screen.getByText("withdraw"));

    await waitFor(() => {
      expect(screen.queryByTestId("temps-sdk")).not.toBeInTheDocument();
    });
  });

  it("gives Temps priority when Google Analytics is also configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROJECT_SLUG", "boilerplate");
    vi.stubEnv("NEXT_PUBLIC_TEMPS_API_URL", "https://temps.example.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-CONFLICT");
    setConsent(ALLOW_ALL);
    renderAnalytics({ google: true });

    await screen.findByTestId("temps-sdk");
    expect(mocks.googleProvider).not.toHaveBeenCalled();
    expect(screen.queryByTestId("google-sdk")).not.toBeInTheDocument();
  });
});
