"use client";

import {useState} from "react";
import {createAddress, updateAddress} from "@/lib/actions/address.actions";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {AlertCircle} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {toast} from "@/hooks/use-toast";

interface Address {
    id: string;
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
}

interface UserAddressFormProps {
    userId: string;
    address?: Address | null;
    onSuccess?: (address: Address) => void;
    onCancel?: () => void;
}

interface FormData {
    name: string;
    surname: string;
    county: string;
    city: string;
    address: string;
}

const UserAddressForm = ({
                             userId,
                             address = null,
                             onSuccess = () => {
                             }
                         }: UserAddressFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [formData, setFormData] = useState<FormData>({
        name: address?.name || "",
        surname: address?.surname || "",
        county: address?.county || "",
        city: address?.city || "",
        address: address?.address || "",
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = address
                ? await updateAddress(address.id, {...formData, user: userId})
                : await createAddress({...formData, user: userId});

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.address) {
                throw new Error("Nu s-au primit date despre adresă");
            }

            toast({
                title: "Succes",
                description: `Adresa a fost ${address ? "actualizată" : "creată"} cu succes`,
            });

            onSuccess(result.address);

            if (!address) {
                setFormData({
                    name: "",
                    surname: "",
                    county: "",
                    city: "",
                    address: "",
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
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    {address ? "Editează Adresa" : "Adaugă Adresă Nouă"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Prenume</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="Introduceți prenumele"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="surname">Nume</Label>
                            <Input
                                id="surname"
                                value={formData.surname}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        surname: e.target.value,
                                    }))
                                }
                                placeholder="Introduceți numele"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="county">Județ</Label>
                            <Input
                                id="county"
                                value={formData.county}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        county: e.target.value,
                                    }))
                                }
                                placeholder="Introduceți județul"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">Oraș</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        city: e.target.value,
                                    }))
                                }
                                placeholder="Introduceți orașul"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adresă</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    address: e.target.value,
                                }))
                            }
                            placeholder="Introduceți adresa completă"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Se procesează..." : address ? "Actualizează Adresa" : "Adaugă Adresa"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default UserAddressForm;