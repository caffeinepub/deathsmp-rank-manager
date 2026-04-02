import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import BlockedOverlay from "./components/BlockedOverlay";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminManager from "./pages/AdminManager";
import Blocked from "./pages/Blocked";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Members from "./pages/Members";
import RankEditor from "./pages/RankEditor";
import Register from "./pages/Register";
import Settings from "./pages/Settings";

function getStoredUser() {
  try {
    const s = localStorage.getItem("deathsmp_auth");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <Outlet />
          <BlockedOverlay />
          <Toaster theme="dark" />
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});

const blockedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blocked",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role === "admin" || user.role === "superAdmin") {
      throw redirect({ to: "/" });
    }
  },
  component: Blocked,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "admin" && user.role !== "superAdmin") {
      throw redirect({ to: "/blocked" });
    }
  },
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/",
  component: Dashboard,
});

const membersRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/members",
  component: Members,
});

const ranksRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/ranks",
  component: RankEditor,
});

const adminsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admins",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user || user.role !== "superAdmin") throw redirect({ to: "/" });
  },
  component: AdminManager,
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  blockedRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    membersRoute,
    ranksRoute,
    adminsRoute,
    settingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
