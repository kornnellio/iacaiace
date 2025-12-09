import Footer from "@/components/shared/Footer";
import NavigationBar from "@/components/shared/NavigationBar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <NavigationBar />
      {children}
      <Footer />
    </div>
  );
}
