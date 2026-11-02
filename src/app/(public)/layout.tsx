import Header from "@/components/header";
import Footer from "@/components/footer";
import GuestNavDrawer from "@/components/guest-nav-drawer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Guest pages set their text in Montserrat, like the reference; headings stay Cormorant.
    <div className="font-guest">
      <GuestNavDrawer />
      <Header />
      {children}
      <Footer />
    </div>
  );
}
