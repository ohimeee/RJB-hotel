"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`transition-colors duration-200 ${
        isActive
          ? "font-semibold text-orange-500"
          : "text-gray-600 hover:text-orange-500"
      }`}
    >
      {children}
    </Link>
  );
}
