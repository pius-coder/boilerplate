import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  COUNTRY_HEADER,
  resolveCountryDetectionHeader,
} from "@/config/country-context";
import {
  ORGANIZATION_CONTEXT_MODE_HEADER,
  ORGANIZATION_HEADER,
  ORGANIZATION_QUERY_PARAM,
  normalizeOrganizationSlug,
} from "@/config/organization-context";
import { DEFAULT_REGION_CODE, REGION_PROFILES } from "@/config/regions";
import { routing } from "@/i18n/routing";
import { applyCountryContext, type CountryResolution } from "@/lib/country-context";
import { normalizeRequestId } from "@/lib/logger/request-id";

/**
 * This file must live in `src/`, not the repository root. Next silently ignores
 * a root middleware file when the project uses a `src` directory.
 */
const intlMiddleware = createMiddleware(routing);

function requestHeadersWithContext(
  request: NextRequest,
  requestId: string,
  isApi: boolean
): { headers: Headers; country: CountryResolution } {
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  headers.set(ORGANIZATION_CONTEXT_MODE_HEADER, isApi ? "api" : "page");

  const querySlug = normalizeOrganizationSlug(
    request.nextUrl.searchParams.get(ORGANIZATION_QUERY_PARAM)
  );
  const headerSlug = isApi
    ? normalizeOrganizationSlug(request.headers.get(ORGANIZATION_HEADER))
    : null;
  const selectedSlug = querySlug ?? headerSlug;

  // A page's organization comes only from its URL. This deliberately drops a
  // caller-supplied page header so links remain inspectable and shareable.
  if (selectedSlug) {
    headers.set(ORGANIZATION_HEADER, selectedSlug);
  } else {
    headers.delete(ORGANIZATION_HEADER);
  }

  // Country resolution is a display/payment default, never proof of residence
  // or an authorization input. The proxy header is read directly from the
  // environment rather than through getAppEnv(): middleware must not depend on
  // production secrets such as Stripe keys, and detection is off by default.
  const geoHeaderName = resolveCountryDetectionHeader(
    process.env.COUNTRY_DETECTION_HEADER
  );
  const country = applyCountryContext(headers, {
    cookieHeader: request.headers.get("cookie"),
    geoHeaderName,
    geoHeaderValue: geoHeaderName
      ? request.headers.get(geoHeaderName)
      : null,
    supportedCodes: Object.keys(REGION_PROFILES),
    defaultCode: DEFAULT_REGION_CODE,
  });

  return { headers, country };
}

/**
 * Copy Next's internal request-header override metadata onto an intl response.
 *
 * `next-intl` owns locale rewrites, while `NextResponse.next({request})` owns
 * forwarding changed headers to the route. Combining their response headers is
 * what makes the same request id visible to route logs instead of adding it
 * only after the request has already completed.
 */
function forwardRequestHeaders(
  response: NextResponse,
  requestHeaders: Headers
): void {
  const forwarding = NextResponse.next({ request: { headers: requestHeaders } });

  for (const [name, value] of forwarding.headers) {
    if (
      name === "x-middleware-override-headers" ||
      name.startsWith("x-middleware-request-")
    ) {
      response.headers.set(name, value);
    }
  }
}

export default function middleware(request: NextRequest) {
  const requestId = normalizeRequestId(request.headers.get("x-request-id"));
  const isApi = request.nextUrl.pathname.startsWith("/api");
  const requestContext = requestHeadersWithContext(request, requestId, isApi);

  // API routes never participate in locale negotiation.
  if (isApi) {
    const response = NextResponse.next({
      request: { headers: requestContext.headers },
    });
    response.headers.set("x-request-id", requestId);
    response.headers.set(COUNTRY_HEADER, requestContext.country.code);
    return response;
  }

  const response = intlMiddleware(request);
  forwardRequestHeaders(response, requestContext.headers);
  response.headers.set("x-request-id", requestId);
  response.headers.set(COUNTRY_HEADER, requestContext.country.code);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/api/:path*",
    "/((?!_next|_vercel|admin|.*\\..*).*)",
  ],
};
