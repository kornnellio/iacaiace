import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/authOptions";
import ControlPanelNavigation from "@/components/control-panel/ControlPanelNavigation";
import { hasControlPanelAccess } from "@/lib/auth/access-control";

export default async function ControlPanelLayout({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ControlPanelNavigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
