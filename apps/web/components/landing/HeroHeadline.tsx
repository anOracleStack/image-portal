import QRCode from "qrcode";

export async function HeroHeadline() {
  const qrSvg = (
    await QRCode.toString("https://rub.pub", {
      type: "svg",
      margin: 0,
      width: 260,
      color: {
        dark: "#5eead4",
        light: "#ffffff00",
      },
    })
  ).replaceAll("#5eead4", "currentColor");

  return (
    <div className="ip-hero-headline ip-animate-in ip-animate-in-delay-1">
      <div
        className="ip-hero-qr-bg"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <h1 className="ip-hero-title ip-hero-grabber">
        <span className="ip-hero-grabber-line">The Next Generation</span>
        <span className="ip-hero-grabber-line ip-hero-grabber-accent">Of QR Codes</span>
      </h1>
    </div>
  );
}
