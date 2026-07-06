import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  // Only allow same-origin relative redirects — reject absolute
  // (`https://evil.com`) and protocol-relative (`//evil.com`) targets.
  const nextParam = searchParams.get("next") ?? "/auth/welcome";
  const next =
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
      ? nextParam
      : "/auth/welcome";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const refCode = cookieStore.get("ip_ref")?.value;
      if (user && refCode) {
        const admin = createAdminClient();
        const { data: referrer } = await admin
          .from("profiles")
          .select("id")
          .eq("referral_code", refCode)
          .maybeSingle();
        if (referrer && referrer.id !== user.id) {
          await admin
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", user.id)
            .is("referred_by", null);
        }
      }

      const res = NextResponse.redirect(new URL(next, requestUrl.origin));
      res.cookies.delete("ip_ref");
      return res;
    }
  }

  const error = searchParams.get("error_description") ?? searchParams.get("error");
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set(
    "error",
    error
      ? "Email confirmation failed. Request a new link from the check-email page."
      : "Sign-in link expired or invalid. Sign in or request a new confirmation email.",
  );
  return NextResponse.redirect(loginUrl);
}
