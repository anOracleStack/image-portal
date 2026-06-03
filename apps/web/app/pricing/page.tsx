"use client";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { BalancedText } from "@/components/ui/BalancedText";
import { PageIntro } from "@/components/ui/PageIntro";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "Get started with the basics.",
    ctas: { label: "Get Started", href: "/dashboard" },
    features: ["3 portals", "200 scans/month", "Basic analytics", "QR export"],
    popular: false,
  },
  {
    name: "Indie",
    price: "$19",
    period: "/mo",
    desc: "For creators & small teams.",
    ctas: {
      label: "Subscribe",
      href: "mailto:sales@rub.pub?subject=Indie Plan",
    },
    features: [
      "25 portals",
      "5,000 scans/month",
      "Full analytics",
      "All exports (QR, poster)",
      "1 team seat",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    desc: "For growing businesses.",
    ctas: {
      label: "Subscribe",
      href: "mailto:sales@rub.pub?subject=Pro Plan",
    },
    features: [
      "100 portals",
      "50,000 scans/month",
      "Full analytics + export",
      "3 team seats",
      "Priority support",
    ],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations at scale.",
    ctas: {
      label: "Contact Us",
      href: "mailto:sales@rub.pub?subject=Enterprise Plan",
    },
    features: [
      "Unlimited portals",
      "Unlimited scans",
      "Whitelabel / custom branding",
      "SLA guarantee",
      "Dedicated support",
    ],
    popular: false,
  },
] as const;

const comparisonRows: [string, boolean[], string][] = [
  ["Portal count", [true, true, true, true], "3 / 25 / 100 / Unlimited"],
  ["Monthly scans", [true, true, true, true], "200 / 5k / 50k / Unlimited"],
  ["Team seats", [false, true, true, true], "\u2014 / 1 / 3 / Unlimited"],
  ["QR export", [true, true, true, true], ""],
  ["Poster export", [false, true, true, true], ""],
  ["Full analytics", [false, true, true, true], ""],
  ["API access", [false, false, true, true], ""],
  ["Priority support", [false, false, true, true], ""],
  ["Whitelabel", [false, false, false, true], ""],
  ["SLA", [false, false, false, true], ""],
];

const faqs: [string, string][] = [
  [
    "Can I change plans?",
    "Yes, upgrade or downgrade anytime. Changes are prorated to your billing period.",
  ],
  [
    "What happens if I exceed my scan limit?",
    "We'll notify you. Your portals remain active for the month; you can upgrade to increase your limit.",
  ],
  [
    "Is there a free trial for paid plans?",
    "Start with the Free plan — no credit card required. Upgrade when you need more capacity.",
  ],
  [
    "Can I cancel anytime?",
    "Yes. Your subscription continues until the end of the billing period, then stops.",
  ],
  [
    "What payment methods do you accept?",
    "All major credit cards via Stripe. We're also happy to arrange annual invoicing for Enterprise plans.",
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
          title="Simple, Usage-Based Pricing"
          lines={["Free to start.", "Scale as you grow."]}
        />
      </section>

      <section className="ip-marketing-section ip-marketing-section-tight">
        <div className="ip-pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`ip-pricing-card ${plan.popular ? "ip-pricing-card-popular" : ""}`}
            >
              {plan.popular && (
                <span className="ip-pricing-badge">Most Popular</span>
              )}

              <h3 className="ip-pricing-plan-name">{plan.name}</h3>
              <p className="ip-pricing-plan-desc">{plan.desc}</p>

              <div className="ip-pricing-price-row">
                <span className="ip-pricing-price">{plan.price}</span>
                {plan.period && (
                  <span className="ip-pricing-period">{plan.period}</span>
                )}
              </div>

              <ul className="ip-pricing-features">
                {plan.features.map((f) => (
                  <li key={f} className="ip-pricing-feature">
                    <span className="ip-pricing-check">&#10003;</span>
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

      <section className="ip-marketing-section ip-marketing-section-wide ip-section-center">
        <h2 className="ip-section-title">Compare Plans</h2>

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

      <section className="ip-marketing-section ip-marketing-section-tight ip-section-center ip-marketing-section-narrow">
        <h2 className="ip-section-title">Frequently Asked Questions</h2>

        <div className="ip-faq-list">
          {faqs.map(([q, a]) => (
            <details key={q} className="ip-faq-item">
              <summary className="ip-faq-summary">
                {q}
                <span className="ip-faint">+</span>
              </summary>
              <p className="ip-faq-answer">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
