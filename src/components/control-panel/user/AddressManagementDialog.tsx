"use client";

import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Pencil, Plus, Trash2} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {deleteAddress, getAddressesByUser} from "@/lib/actions/address.actions";
import {toast} from "@/hooks/use-toast";
import UserAddressForm from "./UserAddressForm";

interface Address {
    id: string;
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
    user: string;
}

interface AddressManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    onAddressesUpdate?: () => void;
}

const AddressManagementDialog = ({
                                     open,
                                     onOpenChange,
                                     userId,
                                     userName,
                                     onAddressesUpdate
                                 }: AddressManagementDialogProps) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState<Address | null>(null);
    const [isDeletingAddress, setIsDeletingAddress] = useState<Address | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const loadAddresses = async () => {
        try {
            setIsLoading(true);
            const result = await getAddressesByUser(userId);
            if (result.error) {
                throw new Error(result.error);
            }
            setAddresses(result.addresses || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load addresses"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            setIsAddingAddress(false);
            setIsEditingAddress(null);
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            void loadAddresses();
        }
    }, [open, userId]);

    const handleDeleteAddress = async (addressId: string) => {
        try {
            const result = await deleteAddress(addressId);
            if (result.error) {
                throw new Error(result.error);
            }

            await loadAddresses();
            onAddressesUpdate?.();

            toast({
                title: "Success",
                description: "Address deleted successfully"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete address"
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setIsDeletingAddress(null);
        }
    };

    const handleSuccess = async () => {
        await loadAddresses();
        onAddressesUpdate?.();
        setIsAddingAddress(false);
        setIsEditingAddress(null);
        toast({
            title: "Success",
            description: `Address ${isEditingAddress ? "updated" : "added"} successfully`
        });
        onOpenChange(false);

    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Addresses for {userName}</DialogTitle>
                </DialogHeader>

                {isAddingAddress || isEditingAddress ? (
                    <UserAddressForm
                        userId={userId}
                        address={isEditingAddress}
                        onSuccess={handleSuccess}
                        onCancel={() => {
                            setIsAddingAddress(false);
                            setIsEditingAddress(null);
                        }}
                    />
                ) : (
                    <div className="space-y-4">
                        <Button
                            onClick={() => setIsAddingAddress(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4"/>
                            Add New Address
                        </Button>

                        {isLoading ? (
                            <div className="text-center py-4">Loading addresses...</div>
                        ) : addresses.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>County</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {addresses.map((address) => (
                                        <TableRow key={address.id}>
                                            <TableCell>
                                                {address.name} {address.surname}
                                            </TableCell>
                                            <TableCell>{address.county}</TableCell>
                                            <TableCell>{address.city}</TableCell>
                                            <TableCell>{address.address}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setIsEditingAddress(address)}
                                                    >
                                                        <Pencil className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setIsDeletingAddress(address);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                No addresses found
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this address.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => isDeletingAddress && void handleDeleteAddress(isDeletingAddress.id)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

export default AddressManagementDialog;