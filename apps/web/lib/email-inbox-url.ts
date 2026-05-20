export type EmailInboxLink = {
  label: string;
  href: string;
};

const DOMAIN_INBOX: Record<string, EmailInboxLink> = {
  "gmail.com": { label: "Open Gmail", href: "https://mail.google.com/" },
  "googlemail.com": { label: "Open Gmail", href: "https://mail.google.com/" },
  "outlook.com": { label: "Open Outlook", href: "https://outlook.live.com/mail/" },
  "hotmail.com": { label: "Open Outlook", href: "https://outlook.live.com/mail/" },
  "live.com": { label: "Open Outlook", href: "https://outlook.live.com/mail/" },
  "msn.com": { label: "Open Outlook", href: "https://outlook.live.com/mail/" },
  "yahoo.com": { label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
  "ymail.com": { label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
  "icloud.com": { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" },
  "me.com": { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" },
  "mac.com": { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" },
  "proton.me": { label: "Open Proton Mail", href: "https://mail.proton.me/" },
  "protonmail.com": { label: "Open Proton Mail", href: "https://mail.proton.me/" },
  "aol.com": { label: "Open AOL Mail", href: "https://mail.aol.com/" },
};

export function getEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

/** Known provider inbox, or a best-effort webmail URL for the email domain. */
export function getInboxLinkForEmail(email: string): EmailInboxLink | null {
  const domain = getEmailDomain(email);
  if (!domain) return null;
  const known = DOMAIN_INBOX[domain];
  if (known) return known;
  return {
    label: `Open mail for ${domain}`,
    href: `https://mail.${domain}/`,
  };
}

export function getAuthCallbackUrl(nextPath = "/auth/welcome"): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const next = encodeURIComponent(nextPath);
  return `${origin}/auth/callback?next=${next}`;
}
