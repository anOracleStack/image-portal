"use client";

import { createBrowserClient_ } from "@/lib/supabase-browser";
import { STRIPE_PRICE_IDS } from "@/lib/stripe-plans";
import { useState, useEffect, useCallback } from "react";

const s = {
  page: {
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    minHeight: "100vh",
  },
  dim: "rgba(237,237,237,0.55)" as const,
  section: (py: number) =>
    ({
      maxWidth: 1100,
      margin: "0 auto",
      padding: py + "px 24px",
    }) as const,
} as const;

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
    desc: "For creators and small teams.",
    ctas: {
      label: "Subscribe",
      href: "mailto:sales@imageportal.dev?subject=Indie Plan",
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
      href: "mailto:sales@imageportal.dev?subject=Pro Plan",
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
      href: "mailto:sales@imageportal.dev?subject=Enterprise Plan",
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
    "We&rsquo;ll notify you. Your portals remain active for the month; you can upgrade to increase your limit.",
  ],
  [
    "Is there a free trial for paid plans?",
    "Start with the Free plan &mdash; no credit card required. Upgrade when you need more capacity.",
  ],
  [
    "Can I cancel anytime?",
    "Yes. Your subscription continues until the end of the billing period, then stops.",
  ],
  [
    "What payment methods do you accept?",
    "All major credit cards via Stripe. We&rsquo;re also happy to arrange annual invoicing for Enterprise plans.",
  ],
];

function Navbar() {
  const links: [string, string][] = [
    ["Home", "/"],
    ["Dashboard", "/dashboard"],
    ["Scan", "/scan"],
    ["Gallery", "/gallery"],
  ];

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 1100,
        margin: "0 auto",
        padding: "18px 24px",
      }}
    >
      <a
        href="/"
        style={{
          color: "#ededed",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: "-0.03em",
        }}
      >
        Image Portal
      </a>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            style={{
              color: s.dim,
              textDecoration: "none",
              fontSize: 14,
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ededed")}
            onMouseOut={(e) => (e.currentTarget.style.color = s.dim)}
          >
            {label}
          </a>
        ))}
        <a
          href="/dashboard"
          style={{
            background: "#7df",
            color: "#0a0a0a",
            textDecoration: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Get Started
        </a>
      </div>
    </nav>
  );
}

function Footer() {
  const links: [string, string][] = [
    ["Dashboard", "/dashboard"],
    ["Pricing", "/pricing"],
    ["Scan", "/scan"],
    ["Gallery", "/gallery"],
    ["Privacy", "/privacy"],
  ];
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(237,237,237,0.08)",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <span style={{ color: s.dim, fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Image Portal
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              style={{
                color: s.dim,
                textDecoration: "none",
                fontSize: 14,
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#ededed")}
              onMouseOut={(e) => (e.currentTarget.style.color = s.dim)}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

const PRICE_IDS: Record<string, string | undefined> = {
  indie: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIE,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
};

function CheckoutButton({ plan }: { plan: string }) {
  return (
    <a
      href="#"
      onClick={async (e) => {
        e.preventDefault();
        try {
          // Get current user session
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (!sessionData.user) {
            window.location.href = "/login";
            return;
          }
          const priceId = PRICE_IDS[plan];
          if (!priceId) { alert("No price configured for this plan"); return; }

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
      style={{
        display: "block",
        textAlign: "center",
        padding: "12px 0",
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        textDecoration: "none",
        transition: "transform 0.2s",
        ...(plan === "pro"
          ? { background: "#7df", color: "#0a0a0a" }
          : { background: "transparent", color: "#ededed", boxShadow: "0 0 0 1px rgba(237,237,237,0.2)" }),
      }}
    >
      Subscribe
    </a>
  );
}

export default function PricingPage() {
  return (
    <div style={s.page}>
      <Navbar />

      {/* ---- HEADER ---- */}
      <section style={{ ...s.section(60), textAlign: "center" as const }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            margin: "0 0 12px",
          }}
        >
          Simple, Usage-Based Pricing
        </h1>
        <p style={{ color: s.dim, fontSize: "clamp(1rem, 2vw, 1.15rem)" }}>
          Free to start. Scale as you grow.
        </p>
      </section>

      {/* ---- PRICING CARDS ---- */}
      <section style={s.section(40)}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: "relative",
                background:
                  plan.popular
                    ? "linear-gradient(135deg, rgba(119,221,255,0.08), rgba(119,221,255,0.02))"
                    : "rgba(237,237,237,0.04)",
                borderRadius: 16,
                padding: "32px 24px",
                border: plan.popular
                  ? "1px solid rgba(119,221,255,0.35)"
                  : "1px solid rgba(237,237,237,0.08)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#7df",
                    color: "#0a0a0a",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 20,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Most Popular
                </span>
              )}

              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                {plan.name}
              </h3>
              <p style={{ margin: 0, color: s.dim, fontSize: 13, lineHeight: 1.5 }}>
                {plan.desc}
              </p>

              <div style={{ margin: "20px 0", lineHeight: 1 }}>
                <span
                  style={{
                    fontSize: "clamp(2rem, 4vw, 2.5rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ color: s.dim, fontSize: 14, marginLeft: 2 }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      color: s.dim,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#7df", fontSize: 14 }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.name === "Indie" || plan.name === "Pro" ? (
                <CheckoutButton plan={plan.name.toLowerCase()} />
              ) : (
                <a
                  href={plan.ctas.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 0",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                    transition: "transform 0.2s",
                    ...(plan.popular
                      ? {
                          background: "#7df",
                          color: "#0a0a0a",
                        }
                      : {
                          background: "transparent",
                          color: "#ededed",
                          boxShadow: "0 0 0 1px rgba(237,237,237,0.2)",
                        }),
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {plan.ctas.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- FEATURE COMPARISON TABLE ---- */}
      <section style={s.section(80)}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
            fontWeight: 700,
            margin: "0 0 36px",
            letterSpacing: "-0.03em",
          }}
        >
          Compare Plans
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 500,
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(237,237,237,0.1)",
                    fontWeight: 600,
                    color: s.dim,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.name}
                    style={{
                      textAlign: "center",
                      padding: "12px 8px",
                      borderBottom: "1px solid rgba(237,237,237,0.1)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: p.popular ? "#7df" : "#ededed",
                    }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, checks, detail]) => (
                <tr key={feature}>
                  <td
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid rgba(237,237,237,0.05)",
                      color: "#ededed",
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </td>
                  {checks.map((has, i) => (
                    <td
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: "14px 8px",
                        borderBottom: "1px solid rgba(237,237,237,0.05)",
                        color: s.dim,
                        fontSize: 13,
                      }}
                    >
                      {detail ? (
                        <span style={{ color: "#ededed", fontSize: 12 }}>
                          {detail}
                        </span>
                      ) : has ? (
                        <span style={{ color: "#7df", fontSize: 16 }}>
                          &#10003;
                        </span>
                      ) : (
                        <span style={{ color: "rgba(237,237,237,0.2)" }}>
                          &mdash;
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section style={{ ...s.section(60), maxWidth: 700 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
            fontWeight: 700,
            margin: "0 0 36px",
            letterSpacing: "-0.03em",
          }}
        >
          Frequently Asked Questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map(([q, a]) => (
            <details
              key={q}
              style={{
                borderBottom: "1px solid rgba(237,237,237,0.06)",
                padding: "18px 0",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#ededed",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {q}
                <span style={{ color: s.dim, fontSize: 18, lineHeight: 1 }}>
                  +
                </span>
              </summary>
              <p
                style={{
                  margin: "10px 0 0",
                  color: s.dim,
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
                dangerouslySetInnerHTML={{ __html: a }}
              />
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
