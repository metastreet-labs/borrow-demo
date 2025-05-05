"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  return (
    <nav className="flex flex-row gap-8 py-8 text-lg">
      <NavLink href="/borrow">Borrow</NavLink>
      <NavLink href="/lend">Lend</NavLink>
      <NavLink href="/auctions">Auctions</NavLink>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-gray-800 font-medium hover:text-black hover:underline decoration-2 underline-offset-4 transition-all duration-200 ${
        isActive ? "underline" : ""
      }`}
    >
      {children}
    </Link>
  );
}
