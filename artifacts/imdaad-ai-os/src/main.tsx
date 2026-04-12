import { createRoot } from "react-dom/client";
import App from "./App";
import { ScanPage } from "./pages/ScanPage";
import { ReportPage } from "./pages/ReportPage";
import { FieldPortal } from "./pages/FieldPortal";
import { FieldJobDeepLink } from "./pages/FieldJobDeepLink";
import { IncidentProvider, useIncidents } from "./context/IncidentContext";
import { NotificationProvider } from "./context/NotificationContext";
import { MemberProfilesProvider } from "./context/MemberProfilesContext";
import { ClientsProvider } from "./context/ClientsContext";
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
          siteId,
          clientId: 'CLT-001',
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
  const isReport = path === '/report' || path === '/report/';
  const isField = path === '/field' || path === '/field/' || path.startsWith('/field/');

  if (isScan) {
    return (
      <NotificationProvider>
        <IncidentProvider>
          <ScanRoute />
        </IncidentProvider>
      </NotificationProvider>
    );
  }

  if (isReport) {
    const params = new URLSearchParams(window.location.search);
    const memberToken = params.get('member') ?? undefined;
    return <ReportPage memberToken={memberToken} />;
  }

  if (isField) {
    // Deep link: /field/job/:jobId — direct entry into a specific job (no PIN required)
    const jobMatch = path.match(/^\/field\/job\/([^/]+)/);
    if (jobMatch) {
      const jobId = jobMatch[1];
      return (
        <NotificationProvider>
          <IncidentProvider>
            <FieldJobDeepLink jobId={jobId} />
          </IncidentProvider>
        </NotificationProvider>
      );
    }

    // Deep link: /field/copilot/:jobId — open job detail with copilot pre-opened
    const copilotMatch = path.match(/^\/field\/copilot\/([^/]+)/);
    if (copilotMatch) {
      const jobId = copilotMatch[1];
      return (
        <NotificationProvider>
          <IncidentProvider>
            <FieldJobDeepLink jobId={jobId} openCopilotImmediately />
          </IncidentProvider>
        </NotificationProvider>
      );
    }

    const woMatch = path.match(/^\/field\/work-orders\/([^/]+)/);
    const initialWorkOrderId = woMatch?.[1] ?? undefined;
    return (
      <NotificationProvider>
        <IncidentProvider>
          <FieldPortal initialWorkOrderId={initialWorkOrderId} />
        </IncidentProvider>
      </NotificationProvider>
    );
  }

  return (
    <ClientsProvider>
      <MemberProfilesProvider>
        <NotificationProvider>
          <IncidentProvider>
            <App />
          </IncidentProvider>
        </NotificationProvider>
      </MemberProfilesProvider>
    </ClientsProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
