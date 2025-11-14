"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export type NavItem = { href: string; label: string };

type SidebarProps = {
  items?: NavItem[];
  className?: string;
};

const defaultItems: NavItem[] = [
  { href: "/admin/home", label: "Home" },
  { href: "/admin/hero", label: "Hero Section" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/gallery", label: "Photo Gallery" },
  { href: "/admin/forms", label: "Forms" },
];

export default function Sidebar({ items = defaultItems, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <aside className={`w-56 bg-[#804499] text-white flex flex-col ${className}`}>
      {/* White top bar with logo */}
      <div className="h-16 bg-white flex items-center justify-center">
        <Image src={logo} alt="Logo" width={40} height={40} className="rounded-full" />
      </div>
      <nav className="px-0 pr-2 space-y-2 py-4 flex-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          if (active) {
            return (
              <div key={item.href} className="relative flex items-center justify-between pl-12 mb-3 bg-white rounded-r-full">
                <Link href={item.href} prefetch={false} className="rounded-full text-[#804499]  font-semibold py-2">
                  {item.label}
                </Link>
                {/* White circle beside the active pill */}
                <span className="absolute right-2 h-3 w-3 rounded-full bg-[#804499] shadow-sm" aria-hidden />
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} prefetch={false} className="block py-2 pl-12 text-white/95 hover:bg-white/10 rounded-r-full">
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="mt-3 block w-full text-left py-3 pl-12 text-white/95 hover:bg-white/10 rounded-r-full"
        >
          Log Out
        </button>
      </nav>
    </aside>
  );
}