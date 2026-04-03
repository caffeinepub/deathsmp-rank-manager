import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronsLeft,
  ChevronsRight,
  Crown,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Skull,
  Sun,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const navItems = [
    { to: "/" as const, label: "DASHBOARD", icon: LayoutDashboard },
    { to: "/members" as const, label: "MEMBERS", icon: Users },
    { to: "/ranks" as const, label: "RANK EDITOR", icon: Crown },
    ...(user?.role === "superAdmin"
      ? [{ to: "/admins" as const, label: "ADMIN MANAGER", icon: ShieldCheck }]
      : []),
    { to: "/settings" as const, label: "SETTINGS", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`${
          collapsed ? "w-14" : "w-56"
        } bg-sidebar border-r border-border flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden`}
      >
        {/* Logo */}
        <div
          className={`border-b border-border border-t-2 border-t-primary ${
            collapsed ? "p-2 flex items-center justify-center" : "p-4"
          }`}
        >
          {collapsed ? (
            <span title="DeathSMP">
              <Skull className="w-5 h-5 text-primary" />
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Skull className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold text-lg tracking-widest uppercase">
                  DeathSMP
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                Rank Management
              </p>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2" data-ocid="nav.panel">
          {navItems.map((item) => {
            const isActive = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid="nav.link"
                title={collapsed ? item.label : undefined}
                className={`flex items-center mb-1 text-xs tracking-widest uppercase transition-colors ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary/20 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`border-t border-border ${collapsed ? "p-2" : "p-3"}`}>
          {!collapsed && (
            <>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 truncate">
                {user?.email}
              </div>
              <div className="text-[10px] text-primary uppercase tracking-wider mb-3">
                {user?.role}
              </div>
            </>
          )}

          {/* Theme toggle */}
          {collapsed ? (
            <button
              type="button"
              onClick={toggleTheme}
              data-ocid="nav.toggle"
              aria-label="Toggle theme"
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="flex items-center justify-center w-full py-1.5 mb-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                {theme === "dark" ? (
                  <Moon className="w-3 h-3" />
                ) : (
                  <Sun className="w-3 h-3" />
                )}
                {theme === "dark" ? "DARK" : "LIGHT"}
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                data-ocid="nav.toggle"
                aria-label="Toggle theme"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  theme === "light" ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    theme === "light" ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Notification bell — hidden when collapsed */}
          {!collapsed && (
            <div className="mb-3">
              <NotificationBell />
            </div>
          )}

          {/* Collapse toggle button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            data-ocid="nav.toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center w-full py-1.5 mb-2 text-muted-foreground hover:text-foreground transition-colors ${
              collapsed
                ? "justify-center"
                : "gap-2 text-xs uppercase tracking-wider"
            }`}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronsLeft className="w-3 h-3" />
                COLLAPSE
              </>
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="nav.button"
            title={collapsed ? "Logout" : undefined}
            className={`flex items-center w-full text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider ${
              collapsed ? "justify-center py-1.5" : "gap-2"
            }`}
          >
            <LogOut className="w-3 h-3" />
            {!collapsed && "LOGOUT"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
