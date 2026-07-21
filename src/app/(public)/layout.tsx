import Header from "@/components/header";
import Footer from "@/components/footer";
import { NavSidebar } from "@/components/nav-sidebar";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Our Story", href: "/our-story" },
  { label: "Details", href: "/details" },
  { label: "RSVP", href: "/rsvp" },
  { label: "Registry", href: "/registry" },
  { label: "Wedding Party", href: "/wedding-party" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavSidebar 
        navItems={NAV_ITEMS}
      />
      <Header />
      {children}
      <Footer />
    </>
  );
}
