"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconKind =
  | "calendar"
  | "course"
  | "cat"
  | "teacher"
  | "order"
  | "invoice"
  | "member"
  | "admin";

function NavIcon({ kind }: { kind: IconKind }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.2" />
          <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" />
          <circle cx="8" cy="10" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      );
    case "course":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.6" />
          <path d="M8 1.7v1.4M8 12.9v1.4M1.7 8h1.4M12.9 8h1.4M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" />
        </svg>
      );
    case "cat":
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.8" />
          <rect x="9" y="2.5" width="4.5" height="4.5" rx="0.8" />
          <rect x="2.5" y="9" width="4.5" height="4.5" rx="0.8" />
          <rect x="9" y="9" width="4.5" height="4.5" rx="0.8" />
        </svg>
      );
    case "teacher":
      return (
        <svg {...common}>
          <circle cx="8" cy="5.5" r="2.3" />
          <path d="M3 13.3c0-2.5 2.2-4.3 5-4.3s5 1.8 5 4.3" />
        </svg>
      );
    case "order":
      return (
        <svg {...common}>
          <path d="M4 2.5h8v11l-1.3-1-1.3 1-1.4-1-1.3 1-1.4-1-1.3 1z" />
          <path d="M6 6h4M6 8.5h4" />
        </svg>
      );
    case "invoice":
      return (
        <svg {...common}>
          <path d="M4.5 2.5h5l2.5 2.5v8.5h-7.5z" />
          <path d="M9.5 2.5V5h2.5" />
          <circle cx="8" cy="10" r="1.7" />
        </svg>
      );
    case "member":
      return (
        <svg {...common}>
          <circle cx="6" cy="8" r="3.3" />
          <path d="M10.5 5.2a3.3 3.3 0 010 5.6" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="M2.5 12.5l7-7" />
          <circle cx="11" cy="5" r="2.2" />
          <path d="M3.5 13.5l1-1M5 12l1-1" />
        </svg>
      );
  }
}

interface NavItem {
  href: string;
  label: string;
  icon: IconKind;
  match?: string; // path prefix to consider active
  role?: "SUPER_ADMIN";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "內容",
    items: [
      { href: "/admin", label: "課程行事曆", icon: "calendar", match: "/admin" },
      { href: "/admin/templates", label: "課程管理", icon: "course" },
      { href: "/admin/categories", label: "分類管理", icon: "cat" },
      { href: "/admin/teachers", label: "導師管理", icon: "teacher" },
    ],
  },
  {
    label: "銷售",
    items: [
      { href: "/admin/orders", label: "訂單管理", icon: "order" },
      { href: "/admin/invoices", label: "發票管理", icon: "invoice" },
    ],
  },
  {
    label: "使用者",
    items: [
      { href: "/admin/members", label: "會員管理", icon: "member" },
      {
        href: "/admin/admins",
        label: "管理員",
        icon: "admin",
        role: "SUPER_ADMIN",
      },
    ],
  },
];

export function SidebarNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.match === "/admin") return pathname === "/admin";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <>
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.role || isSuperAdmin);
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="nav-section">
            <div className="nav-label">{group.label}</div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item) ? "active" : ""}`}
              >
                <span className="nav-glyph">
                  <NavIcon kind={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        );
      })}
    </>
  );
}
