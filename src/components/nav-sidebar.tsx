"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarProps {
  navItems: readonly { label: string, href: string }[]
}

export function NavSidebar({ navItems }: SidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  if (!isMobile) {
    return null;
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="text-5xl border-b-3 border-burg">
        Menu
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 gap-4">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className="text-3xl border-b-3 border-burg py-5 aria-[current=page]:border-l-4 aria-[current=page]:border-l-gold aria-[current=page]:font-bold"
                  >
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Link
          href="/sign-out"
          className="px-2 py-3 text-xl text-burg/70 underline-offset-4 hover:text-burg hover:underline"
          onClick={() => setOpenMobile(false)}
        >
          Sign out
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
