"use client";

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

function IconCircle({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "rgba(119,221,255,0.12)",
        color: "#7df",
        fontWeight: 700,
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function Navbar() {
  const links: [string, string][] = [
    ["Dashboard", "/dashboard"],
    ["Pricing", "/pricing"],
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

function CTAButton({
  primary,
  children,
  href,
  onClick,
}: {
  primary?: boolean;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "14px 32px",
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 16,
        textDecoration: "none",
        cursor: "pointer",
        border: "none",
        transition: "transform 0.2s, box-shadow 0.2s",
        ...(primary
          ? {
              background: "#7df",
              color: "#0a0a0a",
              boxShadow: "0 0 0 1px rgba(119,221,255,0.3)",
            }
          : {
              background: "transparent",
              color: "#ededed",
              boxShadow: "0 0 0 1px rgba(237,237,237,0.2)",
            }),
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        if (primary)
          e.currentTarget.style.boxShadow = "0 0 20px rgba(119,221,255,0.35)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        if (primary)
          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(119,221,255,0.3)";
        else
          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(237,237,237,0.2)";
      }}
    >
      {children}
    </Tag>
  );
}

function UseCaseCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "rgba(237,237,237,0.04)",
        borderRadius: 14,
        padding: 28,
        border: "1px solid rgba(237,237,237,0.06)",
        transition: "border-color 0.25s, background 0.25s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "rgba(119,221,255,0.3)";
        e.currentTarget.style.background = "rgba(119,221,255,0.04)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "rgba(237,237,237,0.06)";
        e.currentTarget.style.background = "rgba(237,237,237,0.04)";
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: s.dim, fontSize: 14, lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <IconCircle label={String(n)} />
      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600 }}>
          {title}
        </h3>
        <p style={{ margin: 0, color: s.dim, fontSize: 14, lineHeight: 1.6 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={s.page}>
      <Navbar />

      <section
        style={{
          ...s.section(100),
          textAlign: "center" as const,
          maxWidth: 720,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            margin: "0 0 20px",
          }}
        >
          Turn Any Image<br />
          Into a Link
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: s.dim,
            lineHeight: 1.7,
            margin: "0 auto 40px",
            maxWidth: 580,
          }}
        >
          Upload an image. Link it to anywhere. The image is the key &mdash; not
          the destination. Anyone with a phone camera can scan it in seconds.
        </p>
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <CTAButton primary href="/dashboard">
            Get Started Free
          </CTAButton>
          <CTAButton
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See How It Works &darr;
          </CTAButton>
        </div>

        <p
          style={{
            marginTop: 48,
            fontSize: 13,
            color: s.dim,
            letterSpacing: "0.02em",
          }}
        >
          No app download &middot; No QR code needed &middot; Change
          destinations anytime
        </p>
      </section>

      <section id="how-it-works" style={s.section(80)}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            margin: "0 0 48px",
            letterSpacing: "-0.03em",
          }}
        >
          How It Works
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 40,
            maxWidth: 580,
            margin: "0 auto",
          }}
        >
          <StepCard
            n={1}
            title="Upload any image"
            desc="A poster, flyer, menu, screenshot, or artwork &mdash; anything works."
          />
          <StepCard
            n={2}
            title="Link it to a destination"
            desc="Your website, social profile, app store, payment link &mdash; change it anytime."
          />
          <StepCard
            n={3}
            title="Share it anywhere"
            desc="Print it, post it, display it on screen. Viewers scan with their phone camera &mdash; no app download needed."
          />
        </div>
      </section>

      <section style={s.section(80)}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            margin: "0 0 48px",
            letterSpacing: "-0.03em",
          }}
        >
          Use Cases
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          <UseCaseCard
            emoji={"\u{1F5BC}\uFE0F"}
            title="Posters &amp; Flyers"
            desc="Printed materials that change with your content. Update the link without reprinting."
          />
          <UseCaseCard
            emoji={"\u{1F37D}\uFE0F"}
            title="Restaurant Menus"
            desc="Menu behind QR? No. The menu image itself is scannable. Change prices and items instantly."
          />
          <UseCaseCard
            emoji={"\u{1F3AB}"}
            title="Event Tickets"
            desc="Link tickets to event pages that update in real-time &mdash; schedule changes, venue info, refunds."
          />
          <UseCaseCard
            emoji={"\u{1F4E6}"}
            title="Product Packaging"
            desc="Turn packaging into a direct channel to your brand &mdash; unboxing videos, manuals, offers."
          />
          <UseCaseCard
            emoji={"\u{1F3A8}"}
            title="Art &amp; Photography"
            desc="Every physical print becomes a gallery link. Collectors scan to see the portfolio."
          />
          <UseCaseCard
            emoji={"\u{1F4BC}"}
            title="Business Cards"
            desc="Your card&rsquo;s design is its own scannable link. No QR code needed, just the card itself."
          />
        </div>
      </section>

      <section style={{ ...s.section(80), maxWidth: 640 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            margin: "0 0 48px",
            letterSpacing: "-0.03em",
          }}
        >
          Why Image Portal?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {[
            [
              "No QR codes needed",
              "QR codes require a printed code. Image Portal uses the image itself &mdash; any existing printed material works.",
            ],
            [
              "Update anytime, never reprint",
              "Change the destination whenever you want. The printed image never changes; the link does.",
            ],
            [
              "Reliable scanning technology",
              "Two-stage recognition: copy-detection embeddings plus geometric verification. Works on printed, distorted, and low-light scans.",
            ],
          ].map(([title, desc]) => (
            <div key={title}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
                {title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: s.dim,
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...s.section(60), textAlign: "center" as const }}>
        <h2
          style={{
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
            fontWeight: 700,
            margin: "0 0 12px",
            letterSpacing: "-0.03em",
          }}
        >
          Pricing
        </h2>
        <p style={{ color: s.dim, fontSize: 15, margin: "0 0 24px" }}>
          Free for 3 portals and 200 scans/month. Pro plans from $19/month.
        </p>
        <a
          href="/pricing"
          style={{
            color: "#7df",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            borderBottom: "1px solid rgba(119,221,255,0.3)",
            paddingBottom: 2,
          }}
        >
          View full pricing &rarr;
        </a>
      </section>

      <Footer />
    </div>
  );
}
