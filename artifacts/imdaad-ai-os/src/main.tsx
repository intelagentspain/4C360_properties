import { createRoot } from "react-dom/client";
import App from "./App";
import { ScanPage } from "./pages/ScanPage";
import { IncidentProvider, useIncidents } from "./context/IncidentContext";
import "./index.css";

function ScanRoute() {
  const { addIncident } = useIncidents();
  const base = import.meta.env.BASE_URL ?? '/';

  const pathPart = window.location.pathname.replace(base.replace(/\/$/, ''), '');
  const match = pathPart.match(/^\/scan\/([^/]+)\/([^/]+)/);
  const siteId  = match?.[1] ?? 'silicon-oasis';
  const assetId = match?.[2] ?? 'general';

  return (
    <ScanPage
      siteId={siteId}
      assetId={assetId}
      onIncidentCreated={(inc) => {
        addIncident({
          ...inc,
          lat: 25.1185,
          lng: 55.3755,
        });
      }}
    />
  );
}

function Root() {
  const base = import.meta.env.BASE_URL ?? '/';
  const path = window.location.pathname.replace(base.replace(/\/$/, ''), '');
  const isScan = path.startsWith('/scan/');

  if (isScan) {
    return (
      <IncidentProvider>
        <ScanRoute />
      </IncidentProvider>
    );
  }

  return (
    <IncidentProvider>
      <App />
    </IncidentProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
