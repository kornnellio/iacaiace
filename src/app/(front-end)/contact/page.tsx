import ContactForm from "@/components/contact/ContactForm";
import GoogleMap from "@/components/contact/GoogleMap";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-12">Contact</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Vizitează-ne</h2>
            <div className="space-y-4 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">Adresă</h3>
                <p className="text-gray-600">Strada Lecturii, nr 29, sector 2,</p>
                <p className="text-gray-600">cartier Andronache, București</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Program depozit</h3>
                <p className="text-gray-600">
                  Luni-Duminică: 10:00-18:00
                </p>
                <p className="text-gray-600 text-sm italic">(Doar cu telefon în prealabil ca să nu fim plecați pe apă)</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Contact</h3>
                <p className="text-gray-600">Telefon: Cosma - 0784258058</p>
                <p className="text-gray-600">Filip - 0760187443</p>
                <p className="text-gray-600">Email: office@iacaiace.ro</p>
              </div>
            </div>

            {/* Google Maps */}
            <div className="h-[300px] w-full rounded-lg overflow-hidden">
              <GoogleMap />
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
