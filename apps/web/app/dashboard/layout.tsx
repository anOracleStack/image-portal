import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/ensure-profile";
import { Navbar } from "@/components/Navbar";

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
    <div className="ip-page">
      <Navbar user={user} />
      <main className="ip-dash-main">{children}</main>
    </div>
  );
}
