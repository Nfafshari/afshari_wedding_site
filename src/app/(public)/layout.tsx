import Header from "@/components/header";
import Footer from "@/components/footer";
import GuestNavDrawer from "@/components/guest-nav-drawer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GuestNavDrawer />
      <Header />
      {children}
      <Footer />
    </>
  );
}
