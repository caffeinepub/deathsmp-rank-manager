import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminManager from "./pages/AdminManager";
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
    <AuthProvider>
      <Outlet />
      <Toaster theme="dark" />
    </AuthProvider>
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

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/login" });
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
