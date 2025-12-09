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
import { Loader2, Github, Mail, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authenticate } from "@/lib/actions/auth";
import { verifyEmail } from "@/lib/actions/user.actions";
import {
  initiatePasswordReset,
  resetPassword,
} from "@/lib/actions/user.actions";

export default function LoginForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showVerification, setShowVerification] = React.useState(false);
  const [verificationEmail, setVerificationEmail] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [storedPassword, setStoredPassword] = React.useState("");
  const { data: session, status } = useSession();
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [resetRequested, setResetRequested] = React.useState(false);

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyEmail(verificationEmail, verificationCode);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Try logging in again after verification using stored password
        const loginResult = await authenticate({
          email: verificationEmail,
          password: storedPassword,
        });

        if (loginResult.success) {
          window.location.href = "/";
        } else {
          setError(loginResult.error?.message);
        }
      }
    } catch (err) {
      setError("Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await authenticate({
        email,
        password,
      });

      if (result.error?.message.includes("verify your email")) {
        setVerificationEmail(email);
        setStoredPassword(password);
        setShowVerification(true);
        return;
      }

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.success) {
        window.location.href = "/";
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await initiatePasswordReset(resetEmail);
      if (result.error) {
        setError(result.error);
      } else {
        setResetRequested(true);
      }
    } catch (err) {
      setError("Failed to initiate password reset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(resetEmail, resetToken, newPassword);
      if (result.error) {
        setError(result.error);
      } else {
        // Try logging in with new password
        const loginResult = await authenticate({
          email: resetEmail,
          password: newPassword,
        });

        if (loginResult.success) {
          window.location.href = "/";
        } else {
          setError(loginResult.error?.message);
        }
      }
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">
              Bun venit înapoi
            </CardTitle>
            <CardDescription className="text-center">
              Sunteți conectat în acest moment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg">
                  {session.user.name?.charAt(0)}
                  {session.user.surname?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 text-center">
                <h3 className="text-xl font-semibold">
                  {session.user.name} {session.user.surname}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{session.user.username}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{session.user.email}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Puncte Bonus
                </Label>
                <p className="text-sm font-medium">
                  {session.user.bonus_points}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconectare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">
              Verificați-vă Email-ul
            </CardTitle>
            <CardDescription className="text-center">
              Vă rugăm să introduceți codul de verificare trimis pe email
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
              onSubmit={handleVerification}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Cod de Verificare</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Introduceți codul de verificare"
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

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowVerification(false)}
              >
                Înapoi la Autentificare
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">
              {resetRequested ? "Resetare Parolă" : "Ai uitat parola?"}
            </CardTitle>
            <CardDescription className="text-center">
              {resetRequested
                ? "Introduceți codul trimis pe email și noua parolă"
                : "Introduceți email-ul pentru a primi un cod de resetare"}
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
              onSubmit={
                resetRequested ? handleResetPassword : handleForgotPassword
              }
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>

              {resetRequested && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resetToken">Cod de Resetare</Label>
                    <Input
                      id="resetToken"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Introduceți codul de resetare"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Parolă Nouă</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Introduceți noua parolă"
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {resetRequested
                      ? "Se resetează parola..."
                      : "Se trimite codul..."}
                  </>
                ) : resetRequested ? (
                  "Resetează Parola"
                ) : (
                  "Trimite Codul"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetRequested(false);
                  setResetEmail("");
                  setResetToken("");
                  setNewPassword("");
                }}
              >
                Înapoi la Autentificare
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
              Bun venit înapoi
            </CardTitle>
            <CardDescription className="text-center">
              Conectați-vă în contul dvs.
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
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
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
                    Se conectează...
                  </>
                ) : (
                  "Conectare"
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
              Nu aveți cont?{" "}
              <Link
                href="/register"
                className="text-primary text-blue-600 hover:underline font-medium"
              >
                Înregistrați-vă aici.
              </Link>
            </div>

            <div className="mt-2 text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setShowForgotPassword(true)}
              >
                Ați uitat parola?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
