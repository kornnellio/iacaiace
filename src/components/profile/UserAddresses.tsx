"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import {
  getAddressesByUser,
  deleteAddress,
} from "@/lib/actions/address.actions";

import { toast } from "@/hooks/use-toast";
import UserAddressForm from "../control-panel/user/UserAddressForm";

export function UserAddresses({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  async function loadAddresses() {
    const result = await getAddressesByUser(userId);
    if (result.addresses) {
      setAddresses(result.addresses);
    }
  }

  async function handleDelete(addressId: string) {
    const result = await deleteAddress(addressId);
    if (result.success) {
      toast({
        title: "Succes",
        description: "Adresa a fost ștearsă cu succes",
      });
      loadAddresses();
    } else {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: result.error || "Nu s-a putut șterge adresa",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Adresele tale</h3>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Adaugă adresă nouă
        </Button>
      </div>

      {showAddForm && (
        <UserAddressForm
          userId={userId}
          onSuccess={() => {
            setShowAddForm(false);
            loadAddresses();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingAddress && (
        <UserAddressForm
          userId={userId}
          address={editingAddress}
          onSuccess={() => {
            setEditingAddress(null);
            loadAddresses();
          }}
          onCancel={() => setEditingAddress(null)}
        />
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <Card key={address.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {address.name} {address.surname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.county}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAddress(address)}
                  >
                    Editează
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                  >
                    Șterge
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
