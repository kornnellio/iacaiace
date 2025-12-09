import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <div className="flex flex-col space-y-4 p-6">
      <h2 className="text-2xl font-bold text-center">Bun venit</h2>
      <p className="text-center text-gray-600">
        Conectați-vă pentru a accesa contul dvs.
      </p>
      <Button
        onClick={() => signIn()}
        className="w-full"
      >
        Conectare
      </Button>
      <Button
        onClick={() => signIn()}
        variant="outline"
        className="w-full"
      >
        Creează cont
      </Button>
    </div>
  );
}
