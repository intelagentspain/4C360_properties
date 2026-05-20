# 4C360 Board Demo Script

Audience: property-owner executives and board stakeholders  
Scenario: Sobha Pilot Tower handover risk  
Route: `/demo/properties`

## How This Script Is Used

The live demo keeps a scripted narration cue for each chapter section. When ElevenLabs audio is enabled, the app sends the active section script to the board advisor so the narration stays consistent while still allowing live Q&A.

The implemented source lives in:

`artifacts/imdaad-ai-os/src/modules/demo/InteractiveDemoWalkthrough.tsx`

Key source blocks:

- `CHAPTER_NARRATION_OPENERS`
- `SECTION_NARRATION_SCRIPTS`
- `DemoVoiceAdvisor`

## Agent Instruction

You are the 4C360 board demo voice advisor for a property-owner executive audience. When a message starts with `NARRATE:`, speak the narration cue in a polished boardroom tone. Keep narration concise, confident, and close to the supplied wording. Do not invent product claims. If the board asks a question, answer from the Sobha Pilot Tower handover-risk scenario.

## Chapter Openers

### Portfolio Command

Act one starts at portfolio level. The board needs to know where attention is required before anyone opens a project file.

### ProjectCommand Overview

Now we enter the command surface for the live handover risk. The point is not more reporting, it is one place to decide.

### Programme Timeline

The programme chapter translates schedule complexity into a business conversation about handover confidence.

### Stage Gates

Stage gates show whether the next milestone is truly ready, and what evidence or owner action is holding it back.

### Cost Intelligence

Cost intelligence links budget movement to the specific decisions that can still reduce exposure.

### Risk Command

Risk command turns the risk register into a live operating discussion about ownership, mitigation, and consequence.

### AI Forecast

The forecast chapter shows the board what can happen before it happens, with confidence signals attached.

### Obligations

Obligations connect regulatory, contractual, and authority duties directly to delivery progress and proof.

### Evidence

Evidence is where the platform proves readiness, not by storing files, but by controlling gaps before handover.

### VendorIQ

VendorIQ moves the conversation from subjective vendor opinion to measurable performance and corrective action.

### FieldOps

FieldOps shows how site teams create the proof that executive controls need in order to move.

### Resident Experience

The resident layer proves that executive control and front-door service can belong to the same operating system.

### Value Recap

The final chapter converts the story into a pilot recommendation the board can act on.

## Section Scripts

### Portfolio Command / Health Actions

Here, the board sees the portfolio health signal first. Instead of asking for updates asset by asset, leadership can spot the property that needs attention and move straight to action.

Presenter cue: Emphasize that the first win is prioritization. The demo starts with the question every owner asks: where should we spend management time today?

### Portfolio Command / Portfolio Map

The portfolio map turns multiple buildings into one operating picture. The value is not the map itself, it is the connection from asset health into project, vendor, evidence, and field execution.

Presenter cue: Point out that the board can stay at portfolio altitude while still knowing the system is connected underneath.

### Portfolio Command / Command Path

This is the moment the demo becomes actionable. A portfolio signal is no longer an observation, it becomes a command path into the project and the teams that can recover readiness.

Presenter cue: Use this as the bridge from executive visibility to operational control.

### ProjectCommand Overview / Project Context

The project twin gives the board the essential context: budget, progress, owner route, and current control state. It replaces fragmented status packs with one live project surface.

Presenter cue: Make clear that ProjectCommand is not a dashboard island. It is the entry point into all project control lenses.

### ProjectCommand Overview / Control Tabs

These tabs are the control model. Programme, stage gates, cost, risk, obligations, evidence, and forecast stay in the same project context, so the conversation does not reset every time the topic changes.

Presenter cue: Explain that the board can ask any control question without leaving the project story.

### ProjectCommand Overview / Action Queue

The action queue is where the review earns its value. The system surfaces what changed, who owns the next move, and which action protects delivery confidence this week.

Presenter cue: Anchor this on action accountability. This is the difference between reporting and operating.

### Programme Timeline / Critical Path

Critical path is shown in language the board can use. Instead of decoding programme files, leaders see which phase can move handover and where recovery effort should focus.

Presenter cue: Keep it executive: schedule risk is only useful when it identifies a decision.

### Programme Timeline / Contractors

The contractor view connects schedule pressure to accountable parties. Delay is no longer an abstract timeline problem, it is a recovery conversation with the right owner.

Presenter cue: Call out accountability. This is where delivery teams and commercial teams stop debating the source of delay.

### Programme Timeline / Recovery Plan

Recovery planning changes the tone from bad news to options. The board can see what move protects the milestone and what trade-off must be approved.

Presenter cue: Use this to show the platform supports forward action, not only retrospective delay narration.

### Stage Gates / Blocked Gate

The blocked gate makes readiness visible. The board can see the milestone, the blocker, and the owner path without waiting for a separate checklist review.

Presenter cue: This is a strong proof point for handover and commissioning audiences.

### Stage Gates / Evidence Gaps

The evidence gap explains why the gate cannot move. Missing or expired proof is tied to the control point, so the issue becomes specific and assignable.

Presenter cue: Show that 4C360 does not just flag a red status, it explains what proof is missing.

### Stage Gates / Recovery Actions

The recovery action turns the gate problem into a workflow. The board sees who must act, what they need to provide, and how that action protects the next milestone.

Presenter cue: Stress owner action, due timing, and readiness movement.

### Cost Intelligence / Forecast

Cost starts with the movement from baseline to forecast. The board can immediately see whether exposure is a budget issue, a commitment issue, or a decision still waiting for approval.

Presenter cue: Keep the money story simple: where is exposure coming from, and what decision changes it?

### Cost Intelligence / Variations

The variation queue shows commercial pressure before it becomes a surprise. Each pending item is connected to forecast movement and a needed response.

Presenter cue: This is where owners see that compare quotes and variations belong in one commercial view.

### Cost Intelligence / Package Drivers

Package drivers make the forecast explainable. Procurement, progress, and claims can be traced to the package that is actually moving final cost.

Presenter cue: Use this when the board asks, why is the number changing?

### Risk Command / Risk Register

The risk register becomes useful because it is live. Probability, impact, trend, and owner are all visible, so risk review becomes an operating discipline.

Presenter cue: Avoid sounding like generic risk software. The key is connection to project outcomes.

### Risk Command / Mitigation

Mitigation ownership is where risk becomes controllable. The board can challenge whether the action is current, evidenced, and strong enough to reduce exposure.

Presenter cue: Focus on action quality. This is where static risk scores become management accountability.

### Risk Command / Scenario Impact

Scenario impact connects the open risk to cost and programme consequence. The board can compare the cost of mitigation with the cost of doing nothing.

Presenter cue: This is a strong board-level line: risk is shown as a future outcome, not a register entry.

### AI Forecast / Scenarios

Forecast scenarios show what happens if today's blockers continue. Optimistic, base, and pessimistic paths give the board a way to discuss timing, cost, and readiness before the month closes.

Presenter cue: Frame this as decision support, not prediction theatre.

### AI Forecast / Confidence

Confidence explains why the forecast should be trusted. The system exposes the signals and evidence behind the forecast, so the board understands what is strengthening or weakening it.

Presenter cue: Make the trust point explicit. The forecast is only persuasive when the evidence basis is visible.

### AI Forecast / Decision Cards

Decision cards turn the forecast into a choice. The board sees which action improves the base case and which owner must move next.

Presenter cue: Close the forecast chapter on action, not charts.

### Obligations / Register

The obligations register keeps authority, contractual, and owner duties in the delivery conversation. Nothing important sits outside the operating picture.

Presenter cue: Useful for compliance-heavy owners. Show that obligations are connected to projects and owners.

### Obligations / Deadlines

Deadline exposure shows what must be closed before it becomes a delivery issue. The board can prioritize obligations by consequence, not just due date.

Presenter cue: Tie obligations to handover readiness and escalation timing.

### Obligations / Evidence Link

The evidence link closes the loop. An obligation is not complete because someone wrote a note, it is complete when the required proof is attached and traceable.

Presenter cue: This is a simple but powerful proof point for governance.

### Evidence / Readiness

Evidence readiness turns the document repository into a control room. Current, expired, and action-required proof is organized around what can block approval.

Presenter cue: Position evidence as readiness control, not file storage.

### Evidence / Expired Docs

Expired documents are surfaced as operating risk. The board sees the proof that could block handover and the action needed to replace it.

Presenter cue: This section should feel practical and urgent.

### Evidence / Pack Prep

Pack preparation shows how proof becomes board-ready. The system assembles the evidence needed for the next gate so readiness can be reviewed with confidence.

Presenter cue: Connect this directly to handover meetings and owner approvals.

### VendorIQ / Scorecard

VendorIQ starts with measurable performance. SLA, quality, evidence, cost, and repeat failures are pulled into one vendor signal the board can defend.

Presenter cue: Avoid anecdotal vendor language. This is about defensible performance decisions.

### VendorIQ / Quote Compare

Quote comparison becomes stronger when performance context is included. The lowest price is not automatically the best decision if risk and delivery history tell a different story.

Presenter cue: This directly answers the earlier concern about duplicate price analysis. The value is context, not another price table.

### VendorIQ / Action Pack

The action pack converts vendor concern into a formal route. Corrective notice, approvals, KPI targets, and owner follow-up are prepared from the scorecard.

Presenter cue: This is a high-impact section. Show the board that vendor movement is produced, not merely discussed.

### FieldOps / KPI Strip

FieldOps proves that the operating model reaches the site. Survey counts, field progress, and capture status show whether execution data is being created where the work happens.

Presenter cue: Connect field activity back to ProjectCommand and evidence readiness.

### FieldOps / Active Surveys

The survey queue shows work in motion. Assignments, status, capture method, and responses are visible before anyone waits for a weekly site summary.

Presenter cue: Make this practical for operations teams.

### FieldOps / Capture Methods

Capture methods create proof at the source. Mobile inspections and survey workflows make the evidence trail usable before memories fade or documents scatter.

Presenter cue: This is the field-to-evidence bridge.

### Resident Experience / Resident Intake

Resident intake shows the front door of the operating system. Camera, upload, voice, and AI chat routes capture the issue in a structured way from the start.

Presenter cue: Emphasize simplicity for residents and structure for operations.

### Resident Experience / Timeline

The resident timeline reduces status noise. Residents see progress, updates, and next steps, while the operating team keeps the work connected behind the scenes.

Presenter cue: This is the customer-experience proof point.

### Resident Experience / Ops Handoff

The handoff connects resident service to execution. A resident request becomes structured work with an accountable team and a clear next response.

Presenter cue: Show that the platform connects experience, operations, and accountability.

### Value Recap / Operating Model

The recap pulls the story together. Portfolio control, project command, evidence, vendors, field execution, and resident experience now operate as one system.

Presenter cue: Use this to land the three board promises: control, risk to action, and AI operating system.

### Value Recap / Pilot Path

The recommended pilot is intentionally focused. Start with one active handover or critical project where readiness, proof, and action ownership matter immediately.

Presenter cue: Make the next step feel low-risk and concrete.

### Value Recap / Expansion

Expansion is the natural path after the pilot proves value. Add VendorIQ, FieldOps, and resident intake to extend the same operating model across the portfolio.

Presenter cue: Close with a clear path from first win to broader adoption.
