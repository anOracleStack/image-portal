import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/ensure-profile";
import { DashboardFooter } from "@/components/DashboardFooter";
import { DashboardScaleShell } from "@/components/DashboardScaleShell";
import { Navbar } from "@/components/Navbar";
import { GlowBackground } from "@/components/ui/GlowBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id, {
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name,
  });

  return (
    <DashboardScaleShell>
      <div className="ip-page ip-dash-page">
        <GlowBackground showGrid={false} />
        <Navbar user={user} />
        <main className="ip-dash-main">{children}</main>
        <DashboardFooter />
      </div>
    </DashboardScaleShell>
  );
}
