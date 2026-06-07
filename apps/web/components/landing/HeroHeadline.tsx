import QRCode from "qrcode";

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
      <div
        className="ip-hero-qr-bg"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <h1 className="ip-hero-title ip-hero-grabber">
        <span className="ip-hero-grabber-line">
          Turn any <span className="ip-hero-cap">Image</span>
        </span>
        <span className="ip-hero-grabber-line ip-hero-grabber-accent">
          into a <span className="ip-hero-cap">Doorway</span>
        </span>
      </h1>
      <p className="ip-mono ip-badge ip-badge-accent ip-hero-subtitle">
        Next generation QR code
      </p>
    </div>
  );
}
