"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { UserAddresses } from "./UserAddresses";
import { UserDetailsForm } from "./UserDetailsForm";
import { UserOrders } from "./UserOrders";

interface UserProfileCardProps {
  user: User;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-row items-center justify-between space-y-0 pb-8">
        <div className="flex items-center space-x-4">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || "Profile picture"}
              className="rounded-full w-16 h-16"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-lg text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button
          onClick={() => signOut()}
          variant="outline"
        >
          Deconectare
        </Button>
      </div>

      <Tabs
        defaultValue="profile"
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="addresses">Adrese</TabsTrigger>
          <TabsTrigger value="orders">Comenzi</TabsTrigger>
          <TabsTrigger value="security">Securitate</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserDetailsForm user={user} />
        </TabsContent>
        <TabsContent value="addresses">
          <UserAddresses userId={user.id ?? ""} />
        </TabsContent>

        <TabsContent value="orders">
          <UserOrders userId={user.id ?? ""} />
        </TabsContent>
        <TabsContent value="security">
          <ChangePasswordForm userId={user.id ?? ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
