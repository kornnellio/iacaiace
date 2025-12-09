import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Categoria nu a fost găsită</h2>
        <p className="text-gray-600 mb-8">
          Categoria pe care o căutați nu există sau a fost eliminată.
        </p>
        <Button asChild>
          <Link href="/categories">Vizualizează toate categoriile</Link>
        </Button>
      </div>
    </div>
  );
}
