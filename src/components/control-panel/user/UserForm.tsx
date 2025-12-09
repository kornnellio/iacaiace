"use client";

import {useState} from "react";
import {createUser, updateUser} from "@/lib/actions/user.actions";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {AlertCircle} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {toast} from "@/hooks/use-toast";

interface User {
    id: string;
    email: string;
    username: string;
    name: string;
    surname: string;
    bonus_points: number;
}

interface UserFormProps {
    user?: User | null;
    onSuccess?: (user: User) => void;
}

interface FormData {
    email: string;
    username: string;
    password: string;
    name: string;
    surname: string;
    bonus_points: number;
}

const UserForm = ({
                      user = null, onSuccess = () => {
    }
                  }: UserFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [formData, setFormData] = useState<FormData>({
        email: user?.email || "",
        username: user?.username || "",
        password: "",
        name: user?.name || "",
        surname: user?.surname || "",
        bonus_points: user?.bonus_points || 0,
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = user
                ? await updateUser(user.id, formData)
                : await createUser(formData);

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.user) {
                throw new Error("No user data received");
            }

            toast({
                title: "Success",
                description: `User ${user ? "updated" : "created"} successfully`,
            });

            onSuccess(result.user);

            if (!user) {
                setFormData({
                    email: "",
                    username: "",
                    password: "",
                    name: "",
                    surname: "",
                    bonus_points: 0,
                });
            }
        } catch (err) {
            const error = err as Error;
            setError(error.message);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <div className="max-h-[80vh] flex flex-col">
                <CardHeader className="flex-none">
                    <CardTitle className="text-xl font-bold">
                        {user ? "Edit User" : "Create New User"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0 pb-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                                placeholder="Enter email address"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password {user && "(leave blank to keep current password)"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                placeholder="Enter password"
                                required={!user}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">First Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter first name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="surname">Last Name</Label>
                                <Input
                                    id="surname"
                                    value={formData.surname}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            surname: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter last name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bonus_points">Bonus Points</Label>
                            <Input
                                id="bonus_points"
                                type="number"
                                min="0"
                                value={formData.bonus_points}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        bonus_points: parseInt(e.target.value),
                                    }))
                                }
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Processing..." : user ? "Update User" : "Create User"}
                        </Button>
                    </form>
                </CardContent>
            </div>
        </Card>
    );
};

export default UserForm;