import QRCode from "qrcode";
import { HERO_HEADLINE_LINES, HERO_SUBTITLE } from "@/components/landing/content";

export async function HeroHeadline() {
  const qrSvg = (
    await QRCode.toString("https://rub.pub", {
      type: "svg",
      margin: 0,
      width: 300,
      color: {
        dark: "#5eead4",
        light: "#ffffff00",
      },
    })
  ).replaceAll("#5eead4", "currentColor");

  return (
    <div className="ip-hero-headline ip-animate-in ip-animate-in-delay-1">
      <div className="ip-hero-aperture" aria-hidden />
      <div className="ip-hero-qr-bg" aria-hidden>
        <div className="ip-hero-qr-sweep" />
        <div
          className="ip-hero-qr-svg"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>
      <h1 className="ip-hero-title ip-hero-grabber">
        {HERO_HEADLINE_LINES.map((line) => (
          <span key={line} className="ip-hero-grabber-line">
            {line}
          </span>
        ))}
      </h1>
      <p className="ip-hero-subtitle ip-hero-cap">{HERO_SUBTITLE}</p>
    </div>
  );
}
