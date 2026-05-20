import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
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

  // Ensure a profiles row exists for this user.
  const admin = createAdminClient();
  await admin.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id" },
  );

  return (
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
        {children}
      </main>
    </>
  );
}
