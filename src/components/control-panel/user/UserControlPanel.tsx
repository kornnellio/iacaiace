"use client";

import {useEffect, useState} from "react";
import {deleteUser, getUsers, updateUserBonusPoints} from "@/lib/actions/user.actions";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
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
import {Badge} from "@/components/ui/badge";
import {ArrowDown, ArrowUp, Calendar, MapPin, Pencil, Plus, Search, Trash2, User} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import UserForm from "./UserForm";
import AddressManagementDialog from "@/components/control-panel/user/AddressManagementDialog";

interface User {
    id: string;
    email: string;
    username: string;
    name: string;
    surname: string;
    bonus_points: number;
    sign_up_date: Date;
    last_login_date?: Date;
}

const UserControlPanel = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [selectedUserForAddress, setSelectedUserForAddress] = useState<User | null>(null);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await getUsers();

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.users) {
                throw new Error("No users data received");
            }

            setUsers(result.users);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const handleDeleteUser = async (userId: string) => {
        try {
            setIsDeleting(true);
            const result = await deleteUser(userId);

            if (result.error) {
                throw new Error(result.error);
            }

            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
            toast({
                title: "Success",
                description: "User deleted successfully",
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
        }
    };

    const handleUpdateBonusPoints = async (
        userId: string,
        currentPoints: number,
        change: number,
        username: string
    ) => {
        try {
            const result = await updateUserBonusPoints(userId, change);
            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.user) {
                throw new Error("Failed to update bonus points");
            }

            setUsers((prev) =>
                prev.map((user) => (user.id === userId ? {...user, bonus_points: result.user!.bonus_points} : user))
            );

            toast({
                title: "Points updated",
                description: `Updated bonus points for ${username}`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update bonus points",
            });
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.surname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-4">
                        <div className="text-muted-foreground">Loading users...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl">Users</CardTitle>
                        <CardDescription>Manage your user accounts</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4"/>
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                            </DialogHeader>
                            <UserForm
                                onSuccess={(user) => {
                                    // @ts-ignore
                                    setUsers((prev) => [...prev, user]);
                                    setIsDialogOpen(false);
                                    toast({
                                        title: "Success",
                                        description: "User created successfully",
                                    });
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {error && (
                        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                            {error}
                            <Button variant="outline" size="sm" onClick={() => void loadUsers()} className="ml-2">
                                Retry
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400"/>
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Bonus Points</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{`${user.name} ${user.surname}`}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400"/>
                                                    {new Date(user.sign_up_date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{user.bonus_points} points</Badge>
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() =>
                                                                void handleUpdateBonusPoints(user.id, user.bonus_points, 100, user.username)
                                                            }
                                                        >
                                                            <ArrowUp className="h-4 w-4 text-green-600"/>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() =>
                                                                void handleUpdateBonusPoints(user.id, user.bonus_points, -100, user.username)
                                                            }
                                                            disabled={user.bonus_points < 100}
                                                        >
                                                            <ArrowDown className="h-4 w-4 text-red-600"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>


                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Pencil className="h-4 w-4"/>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[600px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit User</DialogTitle>
                                                            </DialogHeader>
                                                            <UserForm
                                                                user={user}
                                                                onSuccess={(updatedUser) => {
                                                                    // @ts-ignore
                                                                    setUsers((prev) =>
                                                                        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                                                                    );
                                                                    toast({
                                                                        title: "Success",
                                                                        description: "User updated successfully",
                                                                    });
                                                                }}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                        onClick={() => {
                                                            setSelectedUserForAddress(user);
                                                            setIsAddressDialogOpen(true);
                                                        }}
                                                    >
                                                        <MapPin className="h-4 w-4"/>

                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            {searchTerm ? "No matching users found" : "No users yet"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account for "
                            {selectedUser?.username}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => selectedUser && void handleDeleteUser(selectedUser.id)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AddressManagementDialog
                open={isAddressDialogOpen}
                onOpenChange={setIsAddressDialogOpen}
                userId={selectedUserForAddress?.id || ""}
                userName={selectedUserForAddress ? `${selectedUserForAddress.name} ${selectedUserForAddress.surname}` : ""}
                onAddressesUpdate={() => {
                    // Optionally refresh user data if needed
                    void loadUsers();
                }}
            />
        </Card>
    );
};

export default UserControlPanel;