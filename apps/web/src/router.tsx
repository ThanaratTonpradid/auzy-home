import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Providers } from "@/components/providers";
import { DeviceDetailPage } from "@/pages/device-detail";
import { DevicesPage } from "@/pages/devices";
import { LoginPage } from "@/pages/login";
import { NewDevicePage } from "@/pages/new-device";
import { OverviewPage } from "@/pages/overview";
import { RegisterPage } from "@/pages/register";
import { RoomsPage } from "@/pages/rooms";

const rootRoute = createRootRoute({
  component: () => (
    <Providers>
      <Outlet />
    </Providers>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rooms",
  component: RoomsPage,
});

const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices",
  component: DevicesPage,
});

const newDeviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices/new",
  component: NewDevicePage,
});

const deviceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices/$id",
  component: DeviceDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  roomsRoute,
  devicesRoute,
  newDeviceRoute,
  deviceDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
