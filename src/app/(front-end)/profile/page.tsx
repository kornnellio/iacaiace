import React from "react";
import { redirect } from "next/navigation";
import { UserProfileCard } from "@/components/profile/UserProfileCard";
import { auth } from "@/lib/auth/authOptions";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <UserProfileCard user={session.user} />
    </div>
  );
}
