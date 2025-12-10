import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/authOptions";
import { hasControlPanelAccess } from "@/lib/auth/access-control";

// Force all control panel pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic';

export default async function ControlPanelGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current session
  const session = await auth();
  const userEmail = session?.user?.email;
  
  // Check if user has access to the control panel
  if (!session || !hasControlPanelAccess(userEmail)) {
    // User is not authorized, redirect to homepage
    redirect("/");
  }

  return <>{children}</>;
} 