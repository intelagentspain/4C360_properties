import { logger } from "./logger";
import { db, clientsTable, sitesTable, teamMembersTable, incidentsTable, ticketsTable, workOrdersTable, projectsTable, sql } from "./db";

const SEED_CLIENTS = [
  {
    id: "CLT-001", name: "Dubai Silicon Oasis", status: "live", region: "Dubai East",
    sector: "Mixed-Use Residential", sites: 14, workOrders: 47, incidentsCount: 3,
    sla: 94, compliance: 98, riskLevel: "low", overdueTasks: 1,
    aiInsight: "All critical assets within SLA. Chiller C-04 flagged for proactive service within 6 days.",
    lastUpdated: "2 min ago",
    contract: { number: "IMD-2024-DSO-001", tier: "Platinum", startDate: "1 Jan 2024", endDate: "31 Dec 2026", renewalDate: "1 Oct 2026", annualValue: "AED 1.1M", penalties: "AED 5,000 per SLA breach beyond 3 per quarter", vendorManager: "Zaid Al-Hamdan — Imdaad HQ" },
  },
  {
    id: "CLT-002", name: "Gate Avenue DIFC", status: "live", region: "Downtown",
    sector: "Commercial Retail", sites: 6, workOrders: 31, incidentsCount: 1,
    sla: 97, compliance: 99, riskLevel: "low", overdueTasks: 0,
    aiInsight: "Exemplary compliance across all zones. Zero overdue tasks. SLA track record above portfolio average.",
    lastUpdated: "5 min ago",
    contract: { number: "IMD-2024-GAV-002", tier: "Platinum", startDate: "1 Mar 2024", endDate: "28 Feb 2027", renewalDate: "1 Dec 2026", annualValue: "AED 600K", vendorManager: "Zaid Al-Hamdan — Imdaad HQ" },
  },
  {
    id: "CLT-003", name: "Business Bay Tower Complex", status: "warning", region: "Business Bay",
    sector: "Commercial Office", sites: 9, workOrders: 62, incidentsCount: 7,
    sla: 81, compliance: 84, riskLevel: "high", overdueTasks: 5,
    aiInsight: "Power BI sync failure causing reporting gaps. 5 overdue tasks require immediate escalation. SLA degrading — 3 open breaches.",
    lastUpdated: "12 min ago",
    contract: { number: "IMD-2023-BBT-003", tier: "Gold", startDate: "1 Jul 2023", endDate: "30 Jun 2026", renewalDate: "1 Apr 2026", annualValue: "AED 1.2M", penalties: "AED 8,000 per SLA breach — 3 breaches triggered this quarter", vendorManager: "Mariam Nasser — Imdaad HQ" },
  },
  {
    id: "CLT-004", name: "JLT North Cluster", status: "critical", region: "Dubai Marina",
    sector: "Mixed-Use Residential", sites: 11, workOrders: 78, incidentsCount: 12,
    sla: 67, compliance: 71, riskLevel: "critical", overdueTasks: 9,
    aiInsight: "CRITICAL: 9 overdue tasks and SLA at 67%. AI predicts further deterioration without immediate supervisor intervention. Lift safety checks overdue.",
    lastUpdated: "1 min ago",
    contract: { number: "IMD-2022-JLT-004", tier: "Silver", startDate: "1 Jan 2023", endDate: "31 Dec 2025", renewalDate: "1 Sep 2025", annualValue: "AED 1.4M", penalties: "AED 10,000 per breach — 9 breaches triggered YTD", vendorManager: "Sami Qasem — Imdaad HQ" },
  },
  {
    id: "CLT-005", name: "DIFC Tower", status: "live", region: "DIFC",
    sector: "Commercial Office", sites: 3, workOrders: 15, incidentsCount: 1,
    sla: 99, compliance: 100, riskLevel: "low", overdueTasks: 0,
    aiInsight: "Excellent performance. All assets within specification.",
    lastUpdated: "8 min ago",
    contract: { number: "IMD-2024-DIFC-005", tier: "Platinum", startDate: "1 Jan 2024", endDate: "31 Dec 2026", renewalDate: "1 Oct 2026", annualValue: "AED 800K", vendorManager: "Zaid Al-Hamdan — Imdaad HQ" },
  },
] as const;

const SEED_SITES = [
  { id: "silicon-oasis", clientId: "CLT-001", name: "Dubai Silicon Oasis", status: "warning", incidentsCount: 3, lat: "25.1185000", lng: "55.3755000" },
  { id: "gate-avenue",   clientId: "CLT-002", name: "Gate Avenue DIFC",   status: "ok",      incidentsCount: 1, lat: "25.2048000", lng: "55.2708000" },
  { id: "business-bay", clientId: "CLT-003", name: "Business Bay Tower Complex", status: "warning", incidentsCount: 7, lat: "25.1872000", lng: "55.2599000" },
  { id: "jlt-north",    clientId: "CLT-004", name: "JLT North Cluster",  status: "critical", incidentsCount: 12, lat: "25.0750000", lng: "55.1390000" },
  { id: "difc-tower",   clientId: "CLT-005", name: "DIFC Tower",         status: "ok",       incidentsCount: 1,  lat: "25.2126000", lng: "55.2797000" },
];

const SEED_TEAM_MEMBERS = [
  { id: "mbr-001", name: "Hassan Yousef",    email: "hassan.yousef@imdaad.ae",   role: "FM Manager",      perspective: "Strategic",    assignedClients: ["Dubai Silicon Oasis", "Gate Avenue DIFC"],   zones: ["Cluster A", "Cluster B", "Block C"],               skills: "HVAC, Electrical, PPM Management, Asset Intelligence",     responsibilities: "Oversee FM operations for Dubai Silicon Oasis and Gate Avenue DIFC\nMonitor SLA performance and escalate breaches immediately\nReview AI dispatch recommendations and adjust automation rules weekly\nConduct monthly KPI reviews with account managers",                          siteIds: ["silicon-oasis", "gate-avenue"], phone: null },
  { id: "mbr-002", name: "Karim R.",         email: "karim.r@imdaad.ae",         role: "FM Engineer",     perspective: "Operational",  assignedClients: ["Dubai Silicon Oasis"],                        zones: ["Cluster A", "Block C"],                            skills: "HVAC Specialist, Refrigerant Handling, Predictive Maintenance",    responsibilities: "Respond to HVAC incidents in Cluster A within SLA targets\nConduct quarterly chiller and AHU servicing\nLog all interventions in the platform after each job\nTrain junior technicians on HVAC diagnostic procedures",                      siteIds: ["silicon-oasis"], phone: null },
  { id: "mbr-003", name: "Rania Al-Farsi",   email: "rania.alfarsi@imdaad.ae",   role: "Account Manager", perspective: "Strategic",    assignedClients: ["Dubai Silicon Oasis"],                        zones: ["Dubai East"],                                      skills: "Client Relations, KPI Reporting, Contract Management",             responsibilities: "Manage the Dubai Silicon Oasis client relationship\nDeliver monthly performance reports to the client board\nTrack contract renewal milestones and renewal readiness\nCoordinate with FM Manager on escalation resolution",                        siteIds: ["silicon-oasis"], phone: null },
  { id: "mbr-004", name: "Tariq Mansour",    email: "tariq.mansour@imdaad.ae",   role: "Site Supervisor", perspective: "Operational",  assignedClients: ["Dubai Silicon Oasis"],                        zones: ["Cluster A", "Cluster B", "Block C", "Recreation Area"], skills: "HVAC & Electrical, Site Safety, Permit to Work",              responsibilities: "Conduct daily site walk-arounds and log observations before 09:00\nEnsure all technicians hold valid permits for high-risk tasks\nChase overdue work orders 30 min before SLA breach\nReview team attendance and assign shift coverage",              siteIds: ["silicon-oasis"], phone: null },
  { id: "mbr-005", name: "Lina Barakat",     email: "lina.barakat@client.ae",    role: "Client",          perspective: "Client",       assignedClients: ["JLT North Cluster"],                          zones: ["Dubai Marina"],                                    skills: "Facility Management Oversight, Compliance Review",                 responsibilities: "Review service request status and SLA compliance\nSubmit and track maintenance requests for JLT North\nAccess performance reports and satisfaction data\nEscalate unresolved issues to Imdaad account management",                      siteIds: ["jlt-north"], phone: null },
  { id: "sara-001", name: "Sara Al-Hassan",  email: "sara.alhassan@imdaad.ae",   role: "Site Supervisor", perspective: "Operational",  assignedClients: ["Dubai Silicon Oasis", "Gate Avenue DIFC"],   zones: ["Cluster A", "Gate Avenue"],                        skills: "Site Supervision, Safety Management",                              responsibilities: "Daily site operations supervision\nSLA monitoring and escalation",                                                                                                                                                                                    siteIds: ["silicon-oasis", "gate-avenue"], phone: "+971501112233" },
  { id: "omar-001", name: "Omar Khalid",     email: "omar.khalid@imdaad.ae",     role: "FM Engineer",     perspective: "Operational",  assignedClients: ["Dubai Silicon Oasis"],                        zones: ["Cluster A"],                                       skills: "HVAC, General Maintenance",                                        responsibilities: "Respond to maintenance calls in Silicon Oasis\nConduct PPM tasks as scheduled",                                                                                                                                                                       siteIds: ["silicon-oasis"], phone: "+971502223344" },
  { id: "layla-001", name: "Layla Mansoor",  email: "layla.mansoor@imdaad.ae",   role: "FM Engineer",     perspective: "Operational",  assignedClients: ["Gate Avenue DIFC", "Business Bay Tower Complex"], zones: ["Gate Avenue", "Business Bay"],               skills: "HVAC, Plumbing",                                                   responsibilities: "Maintenance coverage for Gate Avenue and Business Bay\nRespond to resident requests",                                                                                                                                                                 siteIds: ["gate-avenue", "business-bay"], phone: "+971503334455" },
  { id: "james-001", name: "James Whitfield", email: "james.whitfield@imdaad.ae", role: "Account Manager", perspective: "Strategic",   assignedClients: ["Dubai Silicon Oasis", "Gate Avenue DIFC", "Business Bay Tower Complex"], zones: ["Dubai East", "Downtown", "Business Bay"], skills: "Account Management, Client Relations",                        responsibilities: "Manage client relationships across assigned portfolio\nDeliver performance reports and KPI reviews",                                                                                                                                                   siteIds: ["silicon-oasis", "gate-avenue", "business-bay"], phone: "+971504445566" },
  { id: "priya-001", name: "Priya Nair",     email: "priya.nair@imdaad.ae",      role: "Safety Officer",  perspective: "Operational",  assignedClients: ["Dubai Silicon Oasis"],                        zones: ["Cluster A"],                                       skills: "Safety Management, Compliance, COSHH",                             responsibilities: "Conduct monthly safety audits\nEnsure regulatory compliance across all zones",                                                                                                                                                                         siteIds: ["silicon-oasis"], phone: "+971505556677" },
];

const SEED_INCIDENTS = [
  { id: "INC-SI-001", title: "AC Failure",          location: "Villa 23, Cluster A", severity: "critical", slaMinutes: 45,  elapsed: 6,   source: "AI Capture",          status: "dispatched",  assignedTech: "Karim R.", techId: "KR", description: "AI detected frost pattern on evaporator coil. Consistent with R-410A refrigerant depletion. Resident confirmed unit not cooling.", lat: "25.1185000", lng: "55.3755000", siteId: "silicon-oasis", clientId: "CLT-001", activityLog: [{"time":"10:08 AM","event":"AI Capture detected via resident photo","type":"incident"},{"time":"10:10 AM","event":"Auto-classified: HVAC · Critical · 45 min SLA","type":"ai"},{"time":"10:12 AM","event":"Karim R. dispatched — ETA 4 min · 0.4 km away","type":"dispatch"}], closureNotes: null },
  { id: "INC-SI-002", title: "Water Leak",          location: "Villa 7, Cluster B",  severity: "medium",   slaMinutes: 120, elapsed: 14,  source: "AI Capture",          status: "open",        assignedTech: null,       techId: null, description: "Resident submitted photo of water pooling under kitchen sink. AI matched pattern to slow pipe joint failure. No structural damage detected.", lat: "25.1160000", lng: "55.3785000", siteId: "gate-avenue", clientId: "CLT-002", activityLog: [{"time":"10:10 AM","event":"Incident reported via Resident App with photo","type":"incident"},{"time":"10:11 AM","event":"Auto-classified: Plumbing · Medium · 120 min SLA","type":"ai"}], closureNotes: null },
  { id: "INC-SI-003", title: "Lift Fault",          location: "Block C",             severity: "high",     slaMinutes: 60,  elapsed: 22,  source: "WhatsApp → Manual",   status: "in-progress", assignedTech: "Faisal N.", techId: "FN", description: "Lift stopped between floors — reported via WhatsApp message thread. Manual review escalated to high priority. No occupants trapped.", lat: "25.1195000", lng: "55.3765000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"09:58 AM","event":"WhatsApp message received from building supervisor","type":"incident"},{"time":"10:00 AM","event":"Manual review — escalated to High · 60 min SLA","type":"escalation"},{"time":"10:05 AM","event":"Faisal N. dispatched · General · 0.8 km","type":"dispatch"},{"time":"10:18 AM","event":"Faisal N. on-site — diagnosis in progress","type":"update"}], closureNotes: null },
  { id: "INC-SI-004", title: "Power Trip",          location: "Villa 31",            severity: "low",      slaMinutes: 240, elapsed: 31,  source: "Resident App",        status: "assigned",    assignedTech: "Sara M.",  techId: "SM", description: "Resident reported MCB tripping repeatedly. Likely caused by faulty appliance or overloaded circuit. Sara M. assigned for electrical inspection.", lat: "25.1170000", lng: "55.3750000", siteId: "silicon-oasis", clientId: "CLT-001", activityLog: [{"time":"09:49 AM","event":"Service request submitted via Resident App","type":"incident"},{"time":"09:51 AM","event":"Auto-classified: Electrical · Low · 240 min SLA","type":"ai"},{"time":"09:55 AM","event":"Sara M. assigned — ETA 22 min","type":"dispatch"}], closureNotes: null },
  { id: "INC-SI-005", title: "Gate Intercom Down",  location: "Main Gate",           severity: "medium",   slaMinutes: 180, elapsed: 45,  source: "Resident App",        status: "overdue",     assignedTech: "Omar T.",  techId: "OT", description: "Main gate intercom system unresponsive. Multiple residents unable to grant access to visitors. Omar T. assigned but job is now overdue.", lat: "25.1175000", lng: "55.3775000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:30 AM","event":"Multiple residents reported via app","type":"incident"},{"time":"09:35 AM","event":"Classified: Electrical · Medium · 180 min SLA","type":"ai"},{"time":"09:40 AM","event":"Omar T. assigned — ETA 15 min","type":"dispatch"},{"time":"10:15 AM","event":"SLA BREACH — job overdue by 15 min","type":"escalation"}], closureNotes: null },
  { id: "INC-SI-006", title: "Pool Pump Noise",     location: "Recreation Area",     severity: "low",      slaMinutes: 360, elapsed: 12,  source: "Resident App",        status: "open",        assignedTech: null,       techId: null, description: "Unusually loud grinding noise from pool pump reported. IoT sensor confirms anomalous vibration signature. Predictive risk flagged at 41%.", lat: "25.1168000", lng: "55.3762000", siteId: "difc-tower", clientId: "CLT-005", activityLog: [{"time":"10:12 AM","event":"Resident reported noise via app","type":"incident"},{"time":"10:13 AM","event":"IoT corroboration: vibration anomaly on PP-02","type":"ai"}], closureNotes: null },
  { id: "INC-SI-007", title: "Gym AC Serviced",     location: "Block C Gym",         severity: "medium",   slaMinutes: 240, elapsed: 210, source: "WhatsApp → Manual",   status: "closed",      assignedTech: "Karim R.", techId: "KR", description: "Scheduled maintenance service completed on gym AHU. Filter replaced, coils cleaned, refrigerant pressure verified. Unit operating within spec.", lat: "25.1190000", lng: "55.3770000", siteId: "silicon-oasis", clientId: "CLT-001", activityLog: [{"time":"Yesterday 09:00 AM","event":"PPM task triggered — scheduled service due","type":"incident"},{"time":"Yesterday 09:15 AM","event":"Karim R. assigned for HVAC service","type":"dispatch"},{"time":"Yesterday 11:30 AM","event":"Service completed — photos submitted","type":"update"},{"time":"Yesterday 11:45 AM","event":"Supervisor approved closure — SLA met (210/240 min)","type":"update"}], closureNotes: "Filter replaced (Grade F7). Coils cleaned — 15% fouling removed. Refrigerant at 98% nominal. No further action required. Next PPM due in 60 days." },

  { id: "INC-JLT-001", title: "Lift Safety Failure",      location: "Cluster N1, Tower 5",   severity: "critical", slaMinutes: 30,  elapsed: 87,  source: "Resident App",      status: "overdue",     assignedTech: "Faisal N.", techId: "FN", description: "Lift stopped between floors with 3 residents trapped in Tower 5. Emergency services notified. SLA breached — no technician on site yet.", lat: "25.0755000", lng: "55.1395000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"08:45 AM","event":"Emergency call received — 3 residents in lift","type":"incident"},{"time":"08:47 AM","event":"Auto-classified: Mechanical · Critical · 30 min SLA","type":"ai"},{"time":"08:52 AM","event":"Faisal N. dispatched — ETA 12 min","type":"dispatch"},{"time":"09:15 AM","event":"SLA BREACH — technician delayed due to traffic","type":"escalation"},{"time":"09:22 AM","event":"Escalated to Site Supervisor — Tariq Mansour notified","type":"escalation"}], closureNotes: null },
  { id: "INC-JLT-002", title: "Fire Suppression Alarm",   location: "Tower 5, Floor 8",      severity: "critical", slaMinutes: 20,  elapsed: 18,  source: "IoT Sensor",        status: "in-progress", assignedTech: "Priya N.", techId: "PN", description: "Automatic fire suppression alarm triggered on Floor 8. IoT smoke sensor reading elevated. Safety officer dispatched to verify — suspected false alarm from kitchen steam.", lat: "25.0758000", lng: "55.1398000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"10:02 AM","event":"IoT smoke sensor alarm triggered — Floor 8","type":"incident"},{"time":"10:03 AM","event":"Auto-classified: Fire Safety · Critical · 20 min SLA","type":"ai"},{"time":"10:05 AM","event":"Priya N. dispatched — ETA 3 min","type":"dispatch"},{"time":"10:14 AM","event":"Priya N. on-site — investigation in progress","type":"update"}], closureNotes: null },
  { id: "INC-JLT-003", title: "HVAC Failure — Block N2",  location: "Villa Block N2",        severity: "critical", slaMinutes: 45,  elapsed: 11,  source: "AI Capture",        status: "dispatched",  assignedTech: "Karim R.", techId: "KR", description: "AI detected critical cooling failure across 4 villas in Block N2. Ambient temperatures exceeding 38°C. Chiller unit CH-N2-01 offline. Karim R. dispatched.", lat: "25.0748000", lng: "55.1388000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"10:08 AM","event":"AI thermal anomaly detected — Block N2 chiller offline","type":"ai"},{"time":"10:09 AM","event":"Auto-classified: HVAC · Critical · 45 min SLA","type":"ai"},{"time":"10:11 AM","event":"Karim R. dispatched — ETA 9 min · 1.2 km","type":"dispatch"}], closureNotes: null },
  { id: "INC-JLT-004", title: "Electrical Fault",         location: "Cluster N2, Substation",severity: "high",     slaMinutes: 60,  elapsed: 34,  source: "WhatsApp → Manual", status: "in-progress", assignedTech: "Omar T.", techId: "OT", description: "Partial power loss to 6 units in Cluster N2. Substation tripped after voltage spike. Omar T. attending to reset and inspect panel.", lat: "25.0745000", lng: "55.1385000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:46 AM","event":"Power loss reported by residents via WhatsApp","type":"incident"},{"time":"09:50 AM","event":"Manual review — High · 60 min SLA","type":"escalation"},{"time":"09:55 AM","event":"Omar T. dispatched — ETA 8 min","type":"dispatch"},{"time":"10:04 AM","event":"Omar T. on-site — panel inspection underway","type":"update"}], closureNotes: null },
  { id: "INC-JLT-005", title: "Water Pressure Loss",      location: "Block N3, Floors 1–4",  severity: "high",     slaMinutes: 120, elapsed: 22,  source: "Resident App",      status: "open",        assignedTech: null,       techId: null, description: "Multiple residents on Floors 1–4 of Block N3 reporting no water pressure. Suspected main valve issue. No technician assigned yet.", lat: "25.0752000", lng: "55.1392000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:58 AM","event":"Resident reports received — 6 units affected","type":"incident"},{"time":"10:00 AM","event":"Auto-classified: Plumbing · High · 120 min SLA","type":"ai"}], closureNotes: null },
  { id: "INC-JLT-006", title: "Parking Barrier Fault",    location: "Main Entrance, JLT N",  severity: "medium",   slaMinutes: 240, elapsed: 55,  source: "Resident App",      status: "assigned",    assignedTech: "Ahmed K.", techId: "AK", description: "Automatic parking barrier arm stuck in raised position. Security manually controlling access. Ahmed K. assigned for mechanical repair.", lat: "25.0750000", lng: "55.1390000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:25 AM","event":"Barrier fault reported via resident app","type":"incident"},{"time":"09:27 AM","event":"Classified: Mechanical · Medium · 240 min SLA","type":"ai"},{"time":"09:35 AM","event":"Ahmed K. assigned — ETA 20 min","type":"dispatch"}], closureNotes: null },
  { id: "INC-JLT-007", title: "Sewage Overflow",          location: "Block N1, Basement",    severity: "high",     slaMinutes: 60,  elapsed: 28,  source: "Resident App",      status: "in-progress", assignedTech: "Faisal N.", techId: "FN", description: "Sewage blockage causing overflow in basement carpark of Block N1. Health hazard — area cordoned off. Faisal N. attending with drainage team.", lat: "25.0753000", lng: "55.1393000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:52 AM","event":"Sewage overflow reported — basement carpark","type":"incident"},{"time":"09:53 AM","event":"Classified: Plumbing · High · 60 min SLA","type":"ai"},{"time":"09:58 AM","event":"Faisal N. dispatched — ETA 5 min","type":"dispatch"},{"time":"10:03 AM","event":"Area cordoned — drainage team mobilised","type":"update"}], closureNotes: null },
  { id: "INC-JLT-008", title: "Generator Failure",        location: "Tower 3, Rooftop",      severity: "high",     slaMinutes: 90,  elapsed: 47,  source: "IoT Sensor",        status: "in-progress", assignedTech: "Omar T.", techId: "OT", description: "Standby generator failed to start during routine test. IoT battery monitor shows low cranking voltage. Omar T. investigating potential replacement.", lat: "25.0748000", lng: "55.1386000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:33 AM","event":"Generator test failure — IoT alert triggered","type":"ai"},{"time":"09:35 AM","event":"Classified: Electrical · High · 90 min SLA","type":"ai"},{"time":"09:40 AM","event":"Omar T. dispatched — ETA 10 min","type":"dispatch"},{"time":"09:52 AM","event":"Omar T. on-site — battery diagnostics in progress","type":"update"}], closureNotes: null },
  { id: "INC-JLT-009", title: "CCTV System Down",         location: "Cluster N2 — All Zones",severity: "medium",   slaMinutes: 180, elapsed: 63,  source: "WhatsApp → Manual", status: "assigned",    assignedTech: "Ahmed K.", techId: "AK", description: "CCTV recording system offline across Cluster N2. Security coverage impacted. Ahmed K. assigned to reset NVR unit and verify camera feeds.", lat: "25.0746000", lng: "55.1384000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"09:17 AM","event":"Security team reported CCTV offline via WhatsApp","type":"incident"},{"time":"09:20 AM","event":"Classified: IT/Security · Medium · 180 min SLA","type":"ai"},{"time":"09:25 AM","event":"Ahmed K. assigned — ETA 15 min","type":"dispatch"}], closureNotes: null },
  { id: "INC-JLT-010", title: "Chiller Plant Fault",      location: "Central Plant Room",    severity: "critical", slaMinutes: 30,  elapsed: 9,   source: "IoT Sensor",        status: "dispatched",  assignedTech: "Karim R.", techId: "KR", description: "Primary chiller in central plant room tripped on high pressure fault. Secondary chiller load at 95%. IoT flagged imminent cascade failure risk.", lat: "25.0751000", lng: "55.1391000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"10:11 AM","event":"IoT: chiller high-pressure trip — plant room","type":"ai"},{"time":"10:12 AM","event":"Classified: HVAC · Critical · 30 min SLA","type":"ai"},{"time":"10:14 AM","event":"Karim R. dispatched — ETA 8 min","type":"dispatch"}], closureNotes: null },
  { id: "INC-JLT-011", title: "Roof Waterproofing Leak",  location: "Tower 2, Roof Level",   severity: "medium",   slaMinutes: 360, elapsed: 110, source: "Resident App",      status: "open",        assignedTech: null,       techId: null, description: "Water ingress detected through roof membrane following overnight rain. Ceiling damage in two penthouses on Level 28. Assessment and emergency repair needed.", lat: "25.0749000", lng: "55.1389000", siteId: "jlt-north", clientId: "CLT-004", activityLog: [{"time":"08:10 AM","event":"Resident reported water ingress — Level 28","type":"incident"},{"time":"08:12 AM","event":"Classified: Civil · Medium · 360 min SLA","type":"ai"}], closureNotes: null },

  { id: "INC-BB-001", title: "Power Surge — Floors 8–12", location: "Tower A, Floors 8–12",  severity: "critical", slaMinutes: 30,  elapsed: 24,  source: "IoT Sensor",        status: "in-progress", assignedTech: "Omar T.", techId: "OT", description: "Power surge tripped MCBs across 5 floors in Tower A. 18 units without power. IoT power monitor logged voltage spike at 10:00 AM. SLA breach imminent.", lat: "25.1875000", lng: "55.2602000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"10:00 AM","event":"IoT power monitor: voltage spike detected — Tower A","type":"ai"},{"time":"10:01 AM","event":"Auto-classified: Electrical · Critical · 30 min SLA","type":"ai"},{"time":"10:04 AM","event":"Omar T. dispatched — ETA 6 min","type":"dispatch"},{"time":"10:12 AM","event":"Omar T. on-site — isolating affected circuit","type":"update"}], closureNotes: null },
  { id: "INC-BB-002", title: "HVAC Failure — Roof Unit",  location: "Block D Rooftop",       severity: "high",     slaMinutes: 90,  elapsed: 134, source: "AI Capture",        status: "overdue",     assignedTech: "Omar T.", techId: "OT", description: "Rooftop AC unit ACU-Roof-D offline. AI scan flagged compressor failure pattern. Job assigned to Omar T. but now overdue — escalation required.", lat: "25.1870000", lng: "55.2598000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"08:26 AM","event":"AI Capture detected compressor failure pattern","type":"ai"},{"time":"08:28 AM","event":"Classified: HVAC · High · 90 min SLA","type":"ai"},{"time":"08:35 AM","event":"Omar T. assigned — ETA 20 min","type":"dispatch"},{"time":"09:55 AM","event":"SLA BREACH — job overdue by 44 min","type":"escalation"}], closureNotes: null },
  { id: "INC-BB-003", title: "Plumbing Burst — Level 14", location: "Tower B, Level 14",     severity: "high",     slaMinutes: 60,  elapsed: 19,  source: "Resident App",      status: "in-progress", assignedTech: "Ahmed K.", techId: "AK", description: "Burst pipe reported on Level 14 of Tower B. Water visible in corridor. Ahmed K. dispatched with emergency plumbing kit to contain leak and repair.", lat: "25.1873000", lng: "55.2601000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"10:01 AM","event":"Emergency report received — water flooding corridor","type":"incident"},{"time":"10:02 AM","event":"Classified: Plumbing · High · 60 min SLA","type":"ai"},{"time":"10:05 AM","event":"Ahmed K. dispatched — ETA 4 min","type":"dispatch"},{"time":"10:16 AM","event":"Ahmed K. on-site — isolating water supply","type":"update"}], closureNotes: null },
  { id: "INC-BB-004", title: "Access Control Failure",    location: "Tower A, Main Lobby",   severity: "medium",   slaMinutes: 180, elapsed: 41,  source: "Resident App",      status: "open",        assignedTech: null,       techId: null, description: "Lobby access control system unresponsive — key fobs not working. Security manually controlling access. Suspected power supply failure to access panel.", lat: "25.1872000", lng: "55.2599000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"09:39 AM","event":"Multiple residents reported fob failures","type":"incident"},{"time":"09:41 AM","event":"Classified: Electrical · Medium · 180 min SLA","type":"ai"}], closureNotes: null },
  { id: "INC-BB-005", title: "Elevator Breakdown",        location: "Tower C, All Elevators",severity: "high",     slaMinutes: 60,  elapsed: 31,  source: "WhatsApp → Manual", status: "in-progress", assignedTech: "Faisal N.", techId: "FN", description: "All three elevators in Tower C offline due to fire-recall mode triggered incorrectly. Building residents stranded on upper floors. Faisal N. investigating control panel.", lat: "25.1874000", lng: "55.2603000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"09:49 AM","event":"Elevator recall fault reported — Tower C management","type":"incident"},{"time":"09:51 AM","event":"Manual review — High · 60 min SLA","type":"escalation"},{"time":"09:55 AM","event":"Faisal N. dispatched — ETA 5 min","type":"dispatch"},{"time":"10:03 AM","event":"Faisal N. on-site — isolating fire recall relay","type":"update"}], closureNotes: null },
  { id: "INC-BB-006", title: "Swimming Pool Filtration",  location: "Tower B, Rooftop Pool", severity: "medium",   slaMinutes: 360, elapsed: 145, source: "Resident App",      status: "open",        assignedTech: null,       techId: null, description: "Pool filtration pump failed on rooftop of Tower B. Water quality below standard. Pool closed to residents until repair completed. Assessment pending.", lat: "25.1871000", lng: "55.2597000", siteId: "business-bay", clientId: "CLT-003", activityLog: [{"time":"08:15 AM","event":"Pool maintenance team reported pump failure","type":"incident"},{"time":"08:17 AM","event":"Classified: Mechanical · Medium · 360 min SLA","type":"ai"}], closureNotes: null },
];

const SEED_TICKETS = [
  { id: "KT-001", incidentId: null,         title: "AC Filter Replacement",        asset: "AHU-Block A",    location: "Block A, Floor 2",    skill: "HVAC",      priority: "high",     status: "new",              tech: null,         techId: null,   slaMinutes: 120, elapsed: 5,   reportedBy: "Resident App",   siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-002", incidentId: null,         title: "Water Heater Fault",           asset: "WH-Villa 14",   location: "Villa 14, Cluster B", skill: "Plumbing",  priority: "medium",   status: "new",              tech: null,         techId: null,   slaMinutes: 180, elapsed: 12,  reportedBy: "WhatsApp",       siteId: "gate-avenue", clientId: "CLT-002" },
  { id: "KT-003", incidentId: "INC-SI-001", title: "HVAC Corrective — Villa 23",  asset: "Chiller C-04",  location: "Villa 23, Cluster A", skill: "HVAC",      priority: "critical", status: "assigned",         tech: "Karim R.",   techId: "KR",   slaMinutes: 45,  elapsed: 6,   reportedBy: "AI Capture",     siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-004", incidentId: "INC-SI-004", title: "Power Trip — Villa 31",        asset: "MCB Panel",     location: "Villa 31",            skill: "Electrical",priority: "low",      status: "assigned",         tech: "Sara M.",    techId: "SM",   slaMinutes: 240, elapsed: 31,  reportedBy: "Resident App",   siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-005", incidentId: null,         title: "Lift Safety Check",            asset: "Lift-Cluster A",location: "Cluster A, Block 2",  skill: "General",   priority: "high",     status: "in-progress",      tech: "Faisal N.",  techId: "FN",   slaMinutes: 60,  elapsed: 18,  reportedBy: "PPM Schedule",   siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-006", incidentId: "INC-SI-002", title: "Plumbing Fix — Villa 7",       asset: "Pipe M22",      location: "Villa 7, Cluster B",  skill: "Plumbing",  priority: "medium",   status: "in-progress",      tech: "Ahmed K.",   techId: "AK",   slaMinutes: 120, elapsed: 14,  reportedBy: "AI Capture",     siteId: "gate-avenue", clientId: "CLT-002" },
  { id: "KT-007", incidentId: null,         title: "Pool Pump Inspection",         asset: "PP-02",         location: "Recreation Area",     skill: "Plumbing",  priority: "low",      status: "awaiting-evidence",tech: "Faisal N.",  techId: "FN",   slaMinutes: 360, elapsed: 45,  reportedBy: "PPM Schedule",   siteId: "difc-tower", clientId: "CLT-005" },
  { id: "KT-008", incidentId: null,         title: "Fire Panel Annual Check",      asset: "FP-01",         location: "Community Centre",    skill: "Safety",    priority: "high",     status: "awaiting-evidence",tech: "Sara M.",    techId: "SM",   slaMinutes: 480, elapsed: 120, reportedBy: "Compliance",     siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-009", incidentId: "INC-SI-007", title: "Gym AC Service",               asset: "AHU-Gym",       location: "Block C Gym",         skill: "HVAC",      priority: "medium",   status: "closed",           tech: "Karim R.",   techId: "KR",   slaMinutes: 240, elapsed: 210, reportedBy: "PPM Schedule",   siteId: "silicon-oasis", clientId: "CLT-001" },
  { id: "KT-010", incidentId: null,         title: "Gate Intercom Repair",         asset: "IC-Main-Gate",  location: "Main Gate",           skill: "Electrical",priority: "medium",   status: "closed",           tech: "Ahmed K.",   techId: "AK",   slaMinutes: 180, elapsed: 160, reportedBy: "Supervisor",     siteId: "jlt-north", clientId: "CLT-004" },
  { id: "KT-011", incidentId: null,         title: "Corridor Light Fix",           asset: "Light-B3",      location: "Block B, Corridor 3", skill: "Electrical",priority: "low",      status: "overdue",          tech: "Omar T.",    techId: "OT",   slaMinutes: 60,  elapsed: 82,  reportedBy: "Resident App",   siteId: "gate-avenue", clientId: "CLT-002" },
  { id: "KT-012", incidentId: null,         title: "Roof AC Unit — Block D",       asset: "ACU-Roof-D",    location: "Block D Rooftop",     skill: "HVAC",      priority: "high",     status: "overdue",          tech: "Omar T.",    techId: "OT",   slaMinutes: 90,  elapsed: 134, reportedBy: "AI Capture",     siteId: "business-bay", clientId: "CLT-003" },
];

const SEED_WORK_ORDERS = [
  { id: "WO-001", incidentId: "INC-SI-001", ticketId: "KT-003", title: "HVAC Corrective — AC Failure Villa 23",        location: "Villa 23, Cluster A", priority: "critical", asset: "Chiller C-04", skill: "HVAC",      siteId: "silicon-oasis", description: "Refrigerant depletion on R-410A unit. Karim R. dispatched for repair.", status: "in-progress" },
  { id: "WO-002", incidentId: "INC-SI-002", ticketId: "KT-006", title: "Plumbing Fix — Water Leak Villa 7",            location: "Villa 7, Cluster B",  priority: "medium",   asset: "Pipe M22",    skill: "Plumbing",  siteId: "gate-avenue",   description: "Slow pipe joint failure under kitchen sink. Ahmed K. attending.", status: "in-progress" },
  { id: "WO-003", incidentId: "INC-SI-003", ticketId: null,      title: "Lift Fault Repair — Block C",                 location: "Block C",             priority: "high",     asset: "Lift B3-01",  skill: "General",   siteId: "business-bay",  description: "Lift stopped between floors. Faisal N. on-site for diagnosis.", status: "in-progress" },
  { id: "WO-004", incidentId: "INC-SI-005", ticketId: "KT-010", title: "Gate Intercom Repair — Main Gate",             location: "Main Gate",           priority: "medium",   asset: "IC-Main-Gate",skill: "Electrical",siteId: "jlt-north",     description: "Intercom system unresponsive — job overdue. Omar T. assigned.", status: "overdue" },
  { id: "WO-005", incidentId: "INC-SI-007", ticketId: "KT-009", title: "Gym AC Service — Block C",                     location: "Block C Gym",         priority: "medium",   asset: "AHU-Gym",     skill: "HVAC",      siteId: "silicon-oasis", description: "PPM service completed. Filter replaced, coils cleaned.", status: "closed" },
];

const SEED_PROJECTS = [
  { id: "PRJ-DSO-001", clientId: "CLT-001", name: "Dubai Silicon Oasis FM",          status: "active", siteCount: 14, description: "Full facilities management for DSO residential and mixed-use portfolio" },
  { id: "PRJ-GAV-001", clientId: "CLT-002", name: "Gate Avenue DIFC FM",             status: "active", siteCount: 6,  description: "Commercial retail FM services for Gate Avenue DIFC" },
  { id: "PRJ-BBT-001", clientId: "CLT-003", name: "Business Bay Tower Complex FM",   status: "active", siteCount: 9,  description: "Office tower FM — MEP, cleaning, and PPM services" },
  { id: "PRJ-JLT-001", clientId: "CLT-004", name: "JLT North Cluster FM",            status: "active", siteCount: 11, description: "Residential cluster FM with lift and HVAC focus" },
  { id: "PRJ-DFC-001", clientId: "CLT-005", name: "DIFC Tower FM",                   status: "active", siteCount: 3,  description: "Commercial office FM for DIFC Tower" },
];

async function ensureTablesExist(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'live',
      region TEXT,
      sector TEXT,
      sites INTEGER DEFAULT 0,
      work_orders INTEGER DEFAULT 0,
      incidents_count INTEGER DEFAULT 0,
      sla INTEGER DEFAULT 100,
      compliance INTEGER DEFAULT 100,
      risk_level TEXT DEFAULT 'low',
      overdue_tasks INTEGER DEFAULT 0,
      ai_insight TEXT,
      last_updated TEXT,
      contract JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ok',
      incidents_count INTEGER DEFAULT 0,
      lat TEXT,
      lng TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      perspective TEXT DEFAULT 'Operational',
      assigned_clients TEXT[] DEFAULT '{}',
      zones TEXT[] DEFAULT '{}',
      skills TEXT,
      responsibilities TEXT,
      privileges TEXT[] DEFAULT '{}',
      mobile TEXT,
      whatsapp TEXT,
      location TEXT,
      availability TEXT,
      shift TEXT,
      comm_channels TEXT[] DEFAULT '{}',
      site_ids TEXT[] DEFAULT '{}',
      phone TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS privileges TEXT[] DEFAULT '{}'`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS mobile TEXT`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS whatsapp TEXT`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS location TEXT`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS availability TEXT`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS shift TEXT`);
  await db.execute(sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS comm_channels TEXT[] DEFAULT '{}'`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT,
      severity TEXT DEFAULT 'low',
      sla_minutes INTEGER,
      elapsed INTEGER DEFAULT 0,
      source TEXT DEFAULT 'Manual',
      status TEXT DEFAULT 'open',
      assigned_tech TEXT,
      tech_id TEXT,
      description TEXT,
      lat DECIMAL(10, 7),
      lng DECIMAL(10, 7),
      image_url TEXT,
      site_id TEXT,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      ai_metadata JSONB,
      activity_log JSONB DEFAULT '[]',
      closure_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      incident_id TEXT REFERENCES incidents(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      asset TEXT,
      location TEXT,
      skill TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'new',
      tech TEXT,
      tech_id TEXT,
      sla_minutes INTEGER,
      elapsed INTEGER DEFAULT 0,
      reported_by TEXT,
      evidence TEXT[] DEFAULT '{}',
      site_id TEXT,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      incident_id TEXT REFERENCES incidents(id) ON DELETE SET NULL,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      location TEXT,
      priority TEXT DEFAULT 'medium',
      asset TEXT,
      skill TEXT,
      site_id TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS photo_evidence (
      id TEXT PRIMARY KEY,
      incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
      ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      filename TEXT,
      uploaded_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      site_count INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function seedTable<T extends Record<string, unknown>>(
  label: string,
  table: Parameters<typeof db.insert>[0],
  rows: readonly T[],
): Promise<void> {
  let inserted = 0;
  for (const row of rows) {
    const result = await db.insert(table).values(row as T).onConflictDoNothing().returning();
    if (result.length > 0) inserted++;
  }
  if (inserted > 0) {
    logger.info({ label, inserted }, "Seeded table rows");
  } else {
    logger.debug({ label }, "Table already seeded — skipping");
  }
}

async function seedIfEmpty(): Promise<void> {
  logger.info("Running per-table seed check…");
  await seedTable("clients",      clientsTable,     SEED_CLIENTS);
  await seedTable("sites",        sitesTable,       SEED_SITES);
  await seedTable("team_members", teamMembersTable, SEED_TEAM_MEMBERS);
  await seedTable("incidents",    incidentsTable,   SEED_INCIDENTS);
  await seedTable("tickets",      ticketsTable,     SEED_TICKETS);
  await seedTable("work_orders",  workOrdersTable,  SEED_WORK_ORDERS);
  await seedTable("projects",     projectsTable,    SEED_PROJECTS);
  logger.info("Per-table seed check complete");
}

export async function initDb(): Promise<void> {
  try {
    logger.info("Initializing database schema…");
    await ensureTablesExist();
    logger.info("DB schema ready");
    await seedIfEmpty();
  } catch (err) {
    logger.error({ err }, "DB initialization failed — server will exit");
    throw err;
  }
}
