"use client";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "Core portals & scans.",
    ctas: { label: "Get started", href: "/dashboard" },
    features: ["3 portals", "200 scans/mo", "Gallery listing", "Basic analytics", "Image export"],
    popular: false,
  },
  {
    name: "Indie",
    price: "$19",
    period: "/mo",
    desc: "Creators & small teams.",
    ctas: {
      label: "Subscribe",
      href: "mailto:sales@rub.pub?subject=Indie Plan",
    },
    features: ["25 portals", "5k scans/mo", "Gallery privacy", "Full analytics", "Poster export", "1 seat"],
    popular: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    desc: "Growing businesses.",
    ctas: {
      label: "Subscribe",
      href: "mailto:sales@rub.pub?subject=Pro Plan",
    },
    features: ["100 portals", "50k scans/mo", "Analytics export", "3 seats", "Priority support"],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Scale & SLAs.",
    ctas: {
      label: "Contact",
      href: "mailto:sales@rub.pub?subject=Enterprise Plan",
    },
    features: ["Unlimited portals", "Unlimited scans", "Whitelabel", "SLA", "Dedicated support"],
    popular: false,
  },
] as const;

const comparisonRows: [string, boolean[], string][] = [
  ["Portal count", [true, true, true, true], "3 / 25 / 100 / Unlimited"],
  ["Monthly scans", [true, true, true, true], "200 / 5k / 50k / Unlimited"],
  ["Team seats", [false, true, true, true], "\u2014 / 1 / 3 / Unlimited"],
  ["Public gallery listing", [true, true, true, true], ""],
  ["Hide from gallery", [false, true, true, true], ""],
  ["Image export", [true, true, true, true], ""],
  ["Poster export", [false, true, true, true], ""],
  ["Full analytics", [false, true, true, true], ""],
  ["API access", [false, false, true, true], ""],
  ["Priority support", [false, false, true, true], ""],
  ["Whitelabel", [false, false, false, true], ""],
  ["SLA", [false, false, false, true], ""],
];

const faqs: [string, readonly string[]][] = [
  [
    "Can I change plans?",
    [
      "Yes — upgrade or downgrade anytime.",
      "Changes are prorated to your billing period.",
    ],
  ],
  [
    "What happens if I exceed my scan limit?",
    [
      "We notify you when you approach the cap.",
      "Portals stay active; upgrade when you need more.",
    ],
  ],
  [
    "Is there a free trial for paid plans?",
    [
      "Start on Free — no card required.",
      "Upgrade when you need more portals or scans.",
    ],
  ],
  [
    "Can I cancel anytime?",
    [
      "Yes. Your subscription runs through",
      "the end of the billing period, then stops.",
    ],
  ],
  [
    "What payment methods do you accept?",
    [
      "Major cards via Stripe.",
      "Annual invoicing is available for Enterprise.",
    ],
  ],
];

const PRICE_IDS: Record<string, string | undefined> = {
  indie: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIE,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
};

function CheckoutButton({
  plan,
  primary,
}: {
  plan: string;
  primary?: boolean;
}) {
  return (
    <a
      href="#"
      className={`ip-pricing-cta ${primary ? "ip-pricing-cta-primary" : "ip-pricing-cta-secondary"}`}
      onClick={async (e) => {
        e.preventDefault();
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (!sessionData.user) {
            window.location.href = "/login";
            return;
          }
          const priceId = PRICE_IDS[plan];
          if (!priceId) {
            alert("No price configured for this plan");
            return;
          }

          const res = await fetch("/api/stripe/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              priceId,
              userId: sessionData.user.id,
              successUrl: "/dashboard",
              cancelUrl: "/pricing",
            }),
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
        } catch (err) {
          console.error(err);
        }
      }}
    >
      Subscribe
    </a>
  );
}

export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-marketing-section-tight ip-section-center">
        <PageIntro
          title="Pricing"
          lines={[
            "Free to start — scale as you grow.",
            "Pick a plan that fits your portals & scans.",
          ]}
        />
      </section>

      <section className="ip-marketing-section ip-marketing-section-tight ip-panel">
        <div className="ip-pricing-grid ip-pricing-grid-compact">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`ip-pricing-card ip-pricing-card-compact ${plan.popular ? "ip-pricing-card-popular" : ""}`}
            >
              {plan.popular && (
                <span className="ip-pricing-badge">Popular</span>
              )}

              <h3 className="ip-pricing-plan-name">{plan.name}</h3>
              <BalancedText
                className="ip-pricing-plan-desc"
                lines={[plan.desc]}
              />

              <div className="ip-pricing-price-row">
                <span className="ip-pricing-price">{plan.price}</span>
                {plan.period && (
                  <span className="ip-pricing-period">{plan.period}</span>
                )}
              </div>

              <ul className="ip-pricing-features">
                {plan.features.map((f) => (
                  <li key={f} className="ip-pricing-feature">
                    <span className="ip-pricing-check" aria-hidden>
                      &#10003;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.name === "Indie" || plan.name === "Pro" ? (
                <CheckoutButton
                  plan={plan.name.toLowerCase()}
                  primary={plan.popular}
                />
              ) : (
                <a
                  href={plan.ctas.href}
                  className={`ip-pricing-cta ${plan.popular ? "ip-pricing-cta-primary" : "ip-pricing-cta-secondary"}`}
                >
                  {plan.ctas.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="ip-marketing-section ip-marketing-section-wide ip-section-center ip-panel">
        <h2 className="ip-display ip-section-title-sm">Compare plans</h2>

        <div className="ip-pricing-table-wrap">
          <table className="ip-pricing-table">
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map((p) => (
                  <th
                    key={p.name}
                    className={p.popular ? "ip-pricing-table-popular" : undefined}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, checks, detail]) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  {checks.map((has, i) => (
                    <td key={i}>
                      {detail && i === 0 ? (
                        <span>{detail}</span>
                      ) : has ? (
                        <span className="ip-pricing-check">&#10003;</span>
                      ) : (
                        <span className="ip-faint">&mdash;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ip-marketing-section ip-marketing-section-tight ip-section-center ip-marketing-section-narrow ip-panel">
        <h2 className="ip-display ip-section-title-sm">FAQ</h2>

        <div className="ip-faq-list">
          {faqs.map(([q, lines]) => (
            <details key={q} className="ip-faq-item">
              <summary className="ip-faq-summary">
                {q}
                <span className="ip-faint">+</span>
              </summary>
              <BalancedText className="ip-faq-answer" lines={lines} />
            </details>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
