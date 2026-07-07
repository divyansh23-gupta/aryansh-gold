import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CartDrawer } from "../components/layout/CartDrawer";
import { StoreProvider } from "../lib/store";
import { AuthProvider } from "../hooks/useAuth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-primary">Aryansh Gold</p>
        <h1 className="mt-4 font-serif text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-foreground px-8 py-3 eyebrow text-background transition-colors hover:bg-primary"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center bg-foreground px-6 py-3 eyebrow text-background transition-colors hover:bg-primary"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center border border-border bg-background px-6 py-3 eyebrow text-foreground transition-colors hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aryansh Gold — Luxury Redefined" },
      {
        name: "description",
        content:
          "Aryansh Gold — luxury artificial jewellery crafted for the modern woman. Timeless necklaces, earrings, rings and bridal collections.",
      },
      { name: "author", content: "Aryansh Gold" },
      { property: "og:title", content: "Aryansh Gold — Luxury Redefined" },
      {
        property: "og:description",
        content:
          "Discover timeless luxury jewellery crafted for every occasion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aryansh Gold — Luxury Redefined" },
      { name: "description", content: "Aryansh Gold — luxury artificial jewellery crafted for the modern woman. Timeless necklaces, earrings, rings and bridal collections." },
      { property: "og:description", content: "Aryansh Gold — luxury artificial jewellery crafted for the modern woman. Timeless necklaces, earrings, rings and bridal collections." },
      { name: "twitter:description", content: "Aryansh Gold — luxury artificial jewellery crafted for the modern woman. Timeless necklaces, earrings, rings and bridal collections." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f4cc9de9-e7fd-431f-bd81-5a1785f4868f/id-preview-134b182f--b63900f7-e261-47ec-881f-e1abba1c58bf.lovable.app-1783108053748.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f4cc9de9-e7fd-431f-bd81-5a1785f4868f/id-preview-134b182f--b63900f7-e261-47ec-881f-e1abba1c58bf.lovable.app-1783108053748.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isRoutingAdmin = router.state.location.pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          {!isRoutingAdmin && <AnnouncementBar />}
          {!isRoutingAdmin && <Navbar />}
          <main>
            <Outlet />
          </main>
          {!isRoutingAdmin && <Footer />}
          <CartDrawer />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
