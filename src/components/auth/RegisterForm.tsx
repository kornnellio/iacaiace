"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { createUser } from "@/lib/actions/user.actions";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { Separator } from "@radix-ui/react-select";
import { verifyEmail } from "@/lib/actions/user.actions";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [verificationToken, setVerificationToken] = React.useState("");
  const [email, setEmail] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      surname: formData.get("surname") as string,
      newsletter: formData.get("newsletter") === "on",
    };

    if (
      !data.email ||
      !data.username ||
      !data.password ||
      !data.name ||
      !data.surname
    ) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createUser(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      setEmail(data.email);
      setIsRegistered(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyEmail(email, verificationToken);

      if (result.error) {
        setError(result.error);
        return;
      }

      window.location.href = "/login";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verificați-vă email-ul</CardTitle>
            <CardDescription>
              Vă rugăm să verificați email-ul pentru codul de verificare și introduceți-l mai jos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleVerification}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="verificationToken">Cod de Verificare</Label>
                <Input
                  id="verificationToken"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se verifică...
                  </>
                ) : (
                  "Verifică Email"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">
              Creează un cont
            </CardTitle>
            <CardDescription className="text-center">
              Introduceți informațiile mai jos pentru a crea contul
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert
                variant="destructive"
                className="mb-6"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nume utilizator</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Prenume</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Nume</Label>
                  <Input
                    id="surname"
                    name="surname"
                    type="text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  name="newsletter"
                />
                <Label
                  htmlFor="newsletter"
                  className="text-sm"
                >
                  Abonați-vă la newsletter pentru noutăți și actualizări
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se creează contul...
                  </>
                ) : (
                  "Creează Cont"
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Sau continuați cu
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>

            <div className="mt-4 text-center text-sm">
              Aveți deja un cont?{" "}
              <Link
                href="/login"
                className="text-primary text-blue-600 hover:underline font-medium"
              >
                Conectați-vă aici.
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
