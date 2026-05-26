"use client";

/**
 * Analytics — GA4 + Microsoft Clarity for Long Conversation.
 *
 * What this handles:
 *   - Initial GA4 + Clarity script injection (afterInteractive)
 *   - SPA route-change tracking (Next.js App Router doesn't fire native
 *     page reloads, so we manually fire `gtag('event', 'page_view', ...)`
 *     on every route change — Clarity picks up SPA changes automatically)
 *
 * Both scripts are gated on env vars. Set NEXT_PUBLIC_GA_ID and
 * NEXT_PUBLIC_CLARITY_ID in .env.local to enable. When unset (e.g. in
 * dev), the component is a no-op.
 *
 * Privacy note: this is a Phase 0 cluster where the cluster's purpose is
 * intimacy. We track route paths and aggregate engagement, not message
 * content. Clarity session recordings see what the member sees, which
 * means they CAN see public Timeline posts. That is acceptable — those
 * posts are public to every cluster member already. What Clarity must
 * NEVER record is the private FAB (`/api/clio/chat`) content — we
 * apply the `data-clarity-mask="true"` attribute on the FAB panel to
 * mask its contents in recordings.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

/**
 * Listens to App Router navigation events and fires a GA4 page_view
 * event with the new path. Clarity needs no equivalent — it watches
 * URL changes natively in the browser.
 */
function GAPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;

    const queryString = searchParams?.toString();
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname ?? "/";

    // Fire a pageview against the configured GA property.
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
      send_to: GA_ID,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  // No-op when both providers are unconfigured.
  if (!GA_ID && !CLARITY_ID) return null;

  return (
    <>
      {GA_ID && (
        <>
          {/* GA4 base library */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          {/* GA4 init + first pageview */}
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                send_page_view: true
              });
            `}
          </Script>
          <GAPageViewTracker />
        </>
      )}

      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  );
}
