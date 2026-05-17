import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const artifactTool = await import('file:///C:/Users/karim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs');

const {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto,
} = artifactTool;

const outDir = path.resolve('artifacts/pitch-packs/sobha-realty');
const previewDir = path.join(outDir, 'previews');
await rm(outDir, { recursive: true, force: true });
await mkdir(previewDir, { recursive: true });

const COLORS = {
  bg: '#06111F',
  bg2: '#091A2E',
  surface: '#0E223C',
  surface2: '#10294A',
  ink: '#F4F7FB',
  soft: '#B9C7D9',
  muted: '#6F86A3',
  line: '#234262',
  gold: '#C7A45D',
  copper: '#B87333',
  cyan: '#18D3FF',
  blue: '#2E7FFF',
  green: '#40D489',
  red: '#FF5A66',
  amber: '#F8C85C',
};

const W = 1920;
const H = 1080;

function s(value, size, color = COLORS.ink, extra = {}) {
  return {
    fontFace: extra.fontFace ?? 'Aptos',
    fontSize: size,
    color,
    bold: extra.bold ?? false,
    italic: extra.italic ?? false,
    lineSpacingMultiple: extra.lineSpacingMultiple ?? 1,
    ...extra,
  };
}

function txt(value, size, color = COLORS.ink, extra = {}) {
  return text(value, {
    name: extra.name,
    width: extra.width ?? fill,
    height: extra.height ?? hug,
    columnSpan: extra.columnSpan,
    rowSpan: extra.rowSpan,
    style: s(value, size, color, extra.style ?? {}),
  });
}

function chip(label, tone = COLORS.gold) {
  return panel(
    {
      width: hug,
      height: hug,
      padding: { x: 16, y: 8 },
      fill: `${tone}22`,
      borderRadius: 'rounded-full',
    },
    txt(label, 17, tone, { width: hug, style: { bold: true } }),
  );
}

function metric(label, value, note, tone = COLORS.gold) {
  return column(
    { width: fill, height: hug, gap: 8 },
    [
      txt(label, 16, COLORS.muted, { style: { bold: true } }),
      txt(value, 42, tone, { style: { bold: true, fontFace: 'Aptos Display' } }),
      txt(note, 18, COLORS.soft, { width: wrap(280) }),
    ],
  );
}

function smallSource(value) {
  return txt(value, 14, COLORS.muted, { width: fill });
}

function shell(children, notes) {
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  return p;
}

function addSlide(presentation, title, children, notes = '', source = '') {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: 'slide-root', width: fill, height: fill },
      [
        shape({ name: 'bg', width: fill, height: fill, fill: COLORS.bg }),
        shape({ name: 'top-field', width: fill, height: fixed(220), fill: COLORS.bg2 }),
        column(
          { name: 'content', width: fill, height: fill, padding: { x: 84, y: 40 }, gap: 18 },
          [
            row(
              { width: fill, height: hug, align: 'center', justify: 'between' },
              [
                column(
                  { width: grow(1), height: hug, gap: 9 },
                  [
                    row({ width: fill, height: hug, gap: 12, align: 'center' }, [
                      chip('Sobha Realty pursuit', COLORS.gold),
                      chip('Executive pitch pack', COLORS.cyan),
                    ]),
                    txt(title, 44, COLORS.ink, { style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.9 } }),
                  ],
                ),
                column(
                  { width: fixed(300), height: fixed(72), gap: 5, align: 'end', justify: 'center' },
                  [
                    txt('DevelopmentX', 20, COLORS.ink, { width: fixed(300), style: { bold: true } }),
                    txt('Powered by 4C360', 14, COLORS.muted, { width: fixed(300) }),
                  ],
                ),
              ],
            ),
            ...children,
            row(
              { width: fill, height: hug, align: 'center', justify: 'between' },
              [
                smallSource(source || 'Evidence-led pitch: public facts separated from inferred operating opportunities.'),
                txt('4C360 confidential discussion draft', 14, COLORS.muted, { width: fixed(360) }),
              ],
            ),
          ],
        ),
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
  if (notes) slide.speakerNotes.setText(notes);
  return slide;
}

function addCover(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { width: fill, height: fill },
      [
        shape({ width: fill, height: fill, fill: COLORS.bg }),
        grid(
          {
            width: fill,
            height: fill,
            columns: [fr(1.25), fr(0.75)],
            rows: [fr(1)],
            columnGap: 36,
            padding: { x: 88, y: 64 },
          },
          [
            column(
              { width: fill, height: fill, gap: 34, justify: 'center' },
              [
                row({ width: fill, height: hug, gap: 12 }, [chip('Sobha Realty', COLORS.gold), chip('Evidence-led executive pitch', COLORS.cyan)]),
                txt('Why Sobha, why now: scale the Art of Detail with a live control layer', 72, COLORS.ink, {
                  width: wrap(1040),
                  style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.86 },
                }),
                txt(
                  '4C360 positions ProjectCommand as the operating twin for premium delivery: quality, programme, cost, evidence, approvals, vendors, handover, and resident readiness in one live decision layer.',
                  28,
                  COLORS.soft,
                  { width: wrap(980), style: { lineSpacingMultiple: 1.08 } },
                ),
                rule({ width: fixed(260), stroke: COLORS.gold, weight: 5 }),
                txt('Prepared for Sobha executive leadership', 22, COLORS.muted, { width: wrap(760) }),
              ],
            ),
            layers(
              { width: fill, height: fill, alignItems: 'center', justifyItems: 'center' },
              [
                shape({ width: fixed(520), height: fixed(520), fill: '#0D243E', borderRadius: 'rounded-full' }),
                shape({ width: fixed(390), height: fixed(390), fill: '#132F4D', borderRadius: 'rounded-full' }),
                shape({ width: fixed(250), height: fixed(250), fill: '#183A5D', borderRadius: 'rounded-full' }),
                column(
                  { width: fixed(430), height: hug, gap: 18, align: 'center' },
                  [
                    txt('AED 30B', 62, COLORS.gold, { width: fill, style: { bold: true, fontFace: 'Aptos Display' } }),
                    txt('FY2025 sales reported by Sobha', 18, COLORS.soft, { width: wrap(360) }),
                    txt('14 UAE developments', 36, COLORS.ink, { width: fill, style: { bold: true, fontFace: 'Aptos Display' } }),
                    txt('97/100 GRESB score', 36, COLORS.cyan, { width: fill, style: { bold: true, fontFace: 'Aptos Display' } }),
                    txt('Growth makes live operating control strategic.', 18, COLORS.soft, { width: wrap(360) }),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
  slide.speakerNotes.setText('Open with the Sobha promise: premium quality at scale. The pitch is not another dashboard. It is an operating layer that protects their brand promise as projects, vendors, approvals, evidence, and handovers multiply.');
}

function addDeckSlides(presentation) {
  addCover(presentation);

  addSlide(
    presentation,
    'Sobha public strengths point to the right wedge',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1), fr(1), fr(1)], columnGap: 28 },
        [
          column({ width: fill, height: fill, gap: 18 }, [
            txt('Signature quality', 32, COLORS.gold, { style: { bold: true } }),
            txt('Sobha publicly emphasizes in-house engineers, craftsmen, technicians, specialists, and a quality control cell reporting to the Group Chairman.', 24, COLORS.soft, { width: fill }),
            rule({ width: fill, stroke: COLORS.line, weight: 2 }),
            txt('Pitch translation: make quality measurable, traceable, and exception-led.', 24, COLORS.ink, { style: { bold: true } }),
          ]),
          column({ width: fill, height: fill, gap: 18 }, [
            txt('Backward integration', 32, COLORS.cyan, { style: { bold: true } }),
            txt('Sobha describes strict quality and efficiency controls across design, construction, facade, joinery, PODs, FM, community management, and security.', 24, COLORS.soft, { width: fill }),
            rule({ width: fill, stroke: COLORS.line, weight: 2 }),
            txt('Pitch translation: connect factory, site, vendors, QA, approvals, and handover.', 24, COLORS.ink, { style: { bold: true } }),
          ]),
          column({ width: fill, height: fill, gap: 18 }, [
            txt('Sustainability and scale', 32, COLORS.green, { style: { bold: true } }),
            txt('Sobha reports GRESB improvement, green finance activity, and continued project expansion across UAE and international markets.', 24, COLORS.soft, { width: fill }),
            rule({ width: fill, stroke: COLORS.line, weight: 2 }),
            txt('Pitch translation: make ESG and delivery proof operational, not retrospective.', 24, COLORS.ink, { style: { bold: true } }),
          ]),
        ],
      ),
    ],
    'This slide shows we studied Sobha. We are not pitching generic proptech; we are mapping directly to what they say differentiates them.',
    'Sources: Sobha Signature Quality page; Sobha Energy Solutions press release; FY2025 update.',
  );

  addSlide(
    presentation,
    'The hidden challenge: preserving premium quality while scaling',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(0.9), fr(1.1)], columnGap: 46 },
        [
          column(
            { width: fill, height: fill, gap: 22, justify: 'center' },
            [
              txt('Scale does not break quality at the headline level. It breaks in handoffs.', 54, COLORS.ink, {
                width: wrap(720),
                style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.92 },
              }),
              txt('Design changes, vendor delays, inspection evidence, authority approvals, commissioning certificates, snag closure, and handover packs can each look local until they compound into delivery confidence risk.', 26, COLORS.soft, { width: wrap(760) }),
            ],
          ),
          column(
            { width: fill, height: fill, gap: 16, justify: 'center' },
            ['Design', 'Procurement', 'Factory output', 'Site progress', 'Inspection', 'Approval', 'Handover', 'Resident trust'].map((step, index) =>
              row(
                { width: fill, height: hug, gap: 18, align: 'center' },
                [
                  txt(String(index + 1).padStart(2, '0'), 22, index < 4 ? COLORS.gold : COLORS.cyan, { width: fixed(56), style: { bold: true } }),
                  rule({ width: fixed(80), stroke: index < 4 ? COLORS.gold : COLORS.cyan, weight: 3 }),
                  txt(step, 29, COLORS.ink, { width: fill, style: { bold: true } }),
                ],
              )
            ),
          ),
        ],
      ),
    ],
    'The operating insight: Sobha has control across the chain, but the chain itself becomes the risk surface. 4C360 makes handoffs visible before they become board issues.',
    'Inference based on Sobha public operating model and common scale risks in construction delivery.',
  );

  addSlide(
    presentation,
    'Pain point map: where 4C360 solves real operating friction',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(0.72), fr(1), fr(1)], rows: [auto, auto, auto, auto, auto], columnGap: 22, rowGap: 14 },
        [
          txt('Pain area', 19, COLORS.gold, { style: { bold: true } }),
          txt('Real operational risk', 19, COLORS.gold, { style: { bold: true } }),
          txt('4C360 efficiency solution', 19, COLORS.gold, { style: { bold: true } }),
          ...[
            ['Delivery drift', 'Float consumed by facade, crane, MEP, weather, approvals, or vendor events.', 'Live Project Control Twin recalculates health, CPI/SPI, EAC, float, and handover confidence.'],
            ['Evidence gaps', 'Rejected proof blocks gates, weakens audit readiness, and slows handover.', 'Evidence Command links proof quality to inspections, stage gates, obligations, and owners.'],
            ['Vendor performance', 'Backward integration still needs objective package-level scorecards and escalation.', 'VendorIQ connects delivery, quality, evidence, cost, and repeat issue signals.'],
            ['Handover trust', 'Premium buyers feel defects, missing documents, and delayed move-in readiness.', 'ResidentPortal + ProjectCommand turns handover readiness into a measurable confidence layer.'],
          ].flatMap(([a, b, c]) => [
            txt(a, 22, COLORS.ink, { style: { bold: true } }),
            txt(b, 21, COLORS.soft),
            txt(c, 21, COLORS.soft),
          ]),
        ],
      ),
    ],
    'Keep this evidence-led. These are not accusations. They are realistic pressure points that naturally appear when a premium developer scales delivery volume.',
    'Pain points are inferred from Sobha public model plus typical construction delivery control risks.',
  );

  addSlide(
    presentation,
    '4C360 answer: the Live Project Control Twin',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1.1), fr(0.9)], columnGap: 44 },
        [
          column(
            { width: fill, height: fill, gap: 24, justify: 'center' },
            [
              row({ width: fill, height: hug, gap: 12 }, ['Baseline', 'Events', 'Impact', 'Decisions', 'Recovery'].map((step, i) => panel({ width: grow(1), padding: { x: 16, y: 14 }, fill: i === 0 ? '#C7A45D22' : i === 4 ? '#40D48922' : '#0C213A', borderRadius: 'rounded-full' }, txt(step, 20, i === 0 ? COLORS.gold : i === 4 ? COLORS.green : COLORS.ink, { style: { bold: true } })))),
              txt('Every event updates the same control state.', 50, COLORS.ink, { style: { bold: true, fontFace: 'Aptos Display' }, width: wrap(840) }),
              txt('Facade delay, authority approval, inspection rejection, variation, vendor issue, or recovery action should not live in separate reports. The twin makes the cascade visible and decision-ready.', 26, COLORS.soft, { width: wrap(860) }),
            ],
          ),
          grid(
            { width: fill, height: fill, columns: [fr(1), fr(1)], rows: [auto, auto, auto, auto], columnGap: 16, rowGap: 16, alignItems: 'stretch' },
            ['Programme', 'Cost', 'Risk', 'Vendors', 'Evidence', 'Workforce', 'Gates', 'Handover'].map((item, i) =>
              panel(
                { width: fill, height: fixed(92), padding: { x: 18, y: 18 }, fill: i % 2 === 0 ? '#10294A' : '#0C213A', borderRadius: 'rounded-lg' },
                txt(item, 23, i < 4 ? COLORS.gold : COLORS.cyan, { style: { bold: true } }),
              )
            ),
          ),
        ],
      ),
    ],
    'This is the product moment: one operating twin, not isolated charts. It is connected to the ProjectCommand demo the user can see live.',
    'Product mapping: current 4C360 ProjectCommand live twin demo.',
  );

  addSlide(
    presentation,
    'Demo story: one event changes the whole control picture',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(0.85), fr(1.15)], columnGap: 44 },
        [
          column(
            { width: fill, height: fill, gap: 20, justify: 'center' },
            [
              txt('Run this live in 7 minutes.', 55, COLORS.ink, { style: { bold: true, fontFace: 'Aptos Display' } }),
              txt('The story is simple: AI reads project material, builds the control baseline, then a real project event creates a cascade that leadership can act on.', 27, COLORS.soft, { width: wrap(700) }),
              panel({ width: fill, height: hug, padding: { x: 24, y: 20 }, fill: '#0C213A', borderRadius: 'rounded-lg' }, txt('Recommended event sequence: facade delay -> approval delay -> evidence rejection -> recovery action approved.', 25, COLORS.cyan, { style: { bold: true } })),
            ],
          ),
          column(
            { width: fill, height: fill, gap: 15, justify: 'center' },
            ['AI reads LOA / project summary', 'Baseline created: programme, cost, gates, vendors, risks, evidence', 'Trigger facade procurement delay', 'Twin recalculates health, SPI, float, EAC, evidence, confidence', 'Copilot recommends manager action and recovery path'].map((step, i) =>
              row(
                { width: fill, height: hug, gap: 18, align: 'center' },
                [
                  panel({ width: fixed(58), height: fixed(58), fill: i === 2 ? '#FF5A6630' : '#18D3FF24', borderRadius: 'rounded-full', align: 'center', justify: 'center' }, txt(String(i + 1), 24, i === 2 ? COLORS.red : COLORS.cyan, { width: fixed(32), style: { bold: true } })),
                  txt(step, 26, COLORS.ink, { width: fill, style: { bold: true } }),
                ],
              )
            ),
          ),
        ],
      ),
    ],
    'Do not demo every tab. Show cause and consequence. The facade delay is strong because it touches vendor, programme, fit-out, cost, and confidence.',
    'Demo source: ProjectCommand overview at /projectcommand/overview.',
  );

  addSlide(
    presentation,
    'Efficiency solutions that hit real pain points',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1), fr(1)], rows: [auto, auto], columnGap: 28, rowGap: 24 },
        [
          ['QA Evidence Command', 'Reject weak evidence early; tie proof to inspection, gate, and handover readiness.', 'Less rework, fewer late audit gaps.'],
          ['Approval Gate Readiness', 'Track authority and compliance dependencies before commissioning pressure.', 'Earlier blocker visibility and cleaner go/no-go reviews.'],
          ['Backward Integration Control', 'Score internal/external package delivery by quality, evidence, cost, and schedule.', 'Objective escalation before vendor/package drift compounds.'],
          ['Handover Confidence', 'Blend snag closure, documents, warranty packs, resident readiness, and project gates.', 'Premium buyer trust protected at move-in.'],
        ].map(([title, body, outcome], i) =>
          panel(
            { width: fill, height: fixed(250), padding: { x: 28, y: 24 }, fill: i % 2 === 0 ? '#10294A' : '#0C213A', borderRadius: 'rounded-lg' },
            column({ width: fill, height: fill, gap: 16 }, [
              txt(title, 30, i < 2 ? COLORS.gold : COLORS.cyan, { style: { bold: true } }),
              txt(body, 23, COLORS.soft, { width: fill }),
              rule({ width: fill, stroke: COLORS.line, weight: 2 }),
              txt(outcome, 22, COLORS.ink, { style: { bold: true } }),
            ]),
          )
        ),
      ),
    ],
    'Make it practical. The pitch is not AI theatre; these are efficiency levers that reduce friction in quality, approval, vendor, and handover workflows.',
    'Efficiency opportunities are framed as pilot measurement targets, not guaranteed ROI.',
  );

  addSlide(
    presentation,
    'Pilot proposal: one live tower or masterplan, 6-8 weeks',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1), fr(1.05)], columnGap: 42 },
        [
          column(
            { width: fill, height: fill, gap: 20, justify: 'center' },
            [
              txt('The pilot should prove control, not boil the ocean.', 56, COLORS.ink, { width: wrap(760), style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.93 } }),
              txt('Select one active tower or masterplan workstream where programme pressure, QA evidence, approvals, vendor packages, and handover readiness all matter.', 27, COLORS.soft, { width: wrap(760) }),
            ],
          ),
          grid(
            { width: fill, height: fill, columns: [fr(1), fr(1)], rows: [auto, auto, auto], columnGap: 18, rowGap: 18 },
            [
              ['Week 1', 'Baseline setup from LOA, BOQ/project summary, milestone, vendor, risk, evidence inputs.'],
              ['Weeks 2-3', 'Connect live project events, gates, evidence rules, and manager action queue.'],
              ['Weeks 4-5', 'Run weekly executive twin review: what changed, exposure, confidence, decisions.'],
              ['Weeks 6-8', 'Measure outcomes, refine playbook, decide expansion into VendorIQ, ResidentPortal, ESG.'],
              ['Inputs', 'Project summary, schedule extracts, cost baseline, QA checklist, vendor list, approval tracker.'],
              ['Outputs', 'Live twin, event feed, control exceptions, decisions, handover confidence, exec readout.'],
            ].map(([a, b], i) =>
              column({ width: fill, height: hug, gap: 8 }, [
                txt(a, 24, i < 4 ? COLORS.gold : COLORS.cyan, { style: { bold: true } }),
                txt(b, 20, COLORS.soft, { width: fill }),
              ])
            ),
          ),
        ],
      ),
    ],
    'The pilot has to be bounded. The commercial ask is a discovery workshop and selecting a live project candidate.',
    'Pilot scope proposed by 4C360; to be validated with Sobha stakeholders.',
  );

  addSlide(
    presentation,
    'Success metrics: measure confidence, not software usage',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1.05), fr(0.95)], columnGap: 42 },
        [
          column(
            { width: fill, height: fill, gap: 21, justify: 'center' },
            [
              txt('The pilot scorecard should read like an operating review.', 56, COLORS.ink, { width: wrap(820), style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.93 } }),
              txt('Avoid vanity AI metrics. Track whether Sobha sees risks earlier, closes evidence gaps faster, protects float, and creates cleaner executive decisions.', 27, COLORS.soft, { width: wrap(820) }),
            ],
          ),
          column(
            { width: fill, height: fill, gap: 17, justify: 'center' },
            [
              ['Float protected', 'Days of schedule exposure identified and recovered.'],
              ['Evidence gaps closed', 'Rejected or missing proof reduced before gate review.'],
              ['Approval blockers surfaced', 'Authority dependencies flagged earlier.'],
              ['Vendor issue cycle time', 'Package issues escalated with evidence and owner.'],
              ['Handover confidence', 'Readiness score improves before buyer-facing milestones.'],
            ].map(([a, b]) =>
              panel({ width: fill, height: hug, padding: { x: 22, y: 16 }, fill: '#0C213A', borderRadius: 'rounded-lg' }, column({ width: fill, height: hug, gap: 4 }, [
                txt(a, 24, COLORS.gold, { style: { bold: true } }),
                txt(b, 20, COLORS.soft, { width: fill }),
              ]))
            ),
          ),
        ],
      ),
    ],
    'The scorecard makes the pilot executive-safe. We are not asking them to believe in AI; we are asking them to measure earlier decisions and reduced friction.',
    'Metrics are pilot measurement targets, not claimed achieved outcomes.',
  );

  addSlide(
    presentation,
    'Executive ask: pick the project where control matters most',
    [
      grid(
        { width: fill, height: grow(1), columns: [fr(1), fr(1)], columnGap: 48 },
        [
          column(
            { width: fill, height: fill, justify: 'center', gap: 28 },
            [
              txt('Recommended next meeting', 29, COLORS.gold, { style: { bold: true } }),
              txt('A 60-minute discovery workshop with development, project controls, QA/QC, commercial, handover, and digital leadership.', 45, COLORS.ink, { width: wrap(780), style: { bold: true, fontFace: 'Aptos Display', lineSpacingMultiple: 0.94 } }),
              txt('Goal: select one pilot candidate and agree which operating signals matter most.', 27, COLORS.soft, { width: wrap(760) }),
            ],
          ),
          column(
            { width: fill, height: fill, justify: 'center', gap: 22 },
            [
              ['1', 'Confirm the business question', 'Where is delivery confidence most valuable this quarter?'],
              ['2', 'Select pilot candidate', 'One tower, stage gate, handover stream, or package cluster.'],
              ['3', 'Agree evidence inputs', 'Schedule, cost baseline, vendors, gates, approvals, QA evidence.'],
              ['4', 'Run live twin review', 'What changed, why it matters, what decision recovers confidence.'],
            ].map(([n, a, b]) =>
              row({ width: fill, height: hug, gap: 18, align: 'center' }, [
                panel({ width: fixed(58), height: fixed(58), fill: '#C7A45D24', borderRadius: 'rounded-full', align: 'center', justify: 'center' }, txt(n, 24, COLORS.gold, { width: fixed(36), style: { bold: true } })),
                column({ width: fill, height: hug, gap: 5 }, [
                  txt(a, 25, COLORS.ink, { style: { bold: true } }),
                  txt(b, 20, COLORS.soft, { width: fill }),
                ]),
              ])
            ),
          ),
        ],
      ),
    ],
    'End with a specific, low-risk ask. They should leave knowing the next step is a discovery workshop and pilot candidate selection.',
    'Executive CTA proposed by 4C360.',
  );
}

function addLeaveBehind(presentation) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { width: fill, height: fill },
      [
        shape({ width: fill, height: fill, fill: COLORS.bg }),
        column(
          { width: fill, height: fill, padding: { x: 70, y: 40 }, gap: 18 },
          [
            row({ width: fill, height: hug, align: 'center', justify: 'between' }, [
              column({ width: grow(1), height: hug, gap: 8 }, [
                txt('4C360 for Sobha Realty', 46, COLORS.ink, { style: { bold: true, fontFace: 'Aptos Display' } }),
                txt("Live quality, delivery, evidence, and handover control for Sobha's scaled development model.", 24, COLORS.soft, { width: wrap(1120) }),
              ]),
              chip('Executive leave-behind', COLORS.gold),
            ]),
            rule({ width: fill, stroke: COLORS.gold, weight: 4 }),
            grid(
              { width: fill, height: grow(1), columns: [fr(0.92), fr(1.08)], columnGap: 34 },
              [
                column({ width: fill, height: fill, gap: 18 }, [
                  txt('Sobha-specific problem frame', 27, COLORS.gold, { style: { bold: true } }),
                  txt('Public facts show a premium developer scaling through quality, backward integration, sustainability, and multiple UAE developments. The operating risk is not whether Sobha values quality; it is whether quality, evidence, approvals, vendors, programme, and handover confidence stay visible as scale compounds.', 22, COLORS.soft, { width: fill }),
                  txt('Pilot wedge', 27, COLORS.cyan, { style: { bold: true } }),
                  txt('Run one 6-8 week Live Project Control Twin pilot on an active tower/masterplan workstream. Start from project material, generate the baseline, simulate or connect live events, and review weekly executive decisions.', 22, COLORS.soft, { width: fill }),
                  panel({ width: fill, height: hug, padding: { x: 24, y: 20 }, fill: '#0C213A', borderRadius: 'rounded-lg' }, txt('Meeting CTA: 60-minute discovery workshop + pilot candidate selection.', 25, COLORS.ink, { style: { bold: true } })),
                ]),
                column({ width: fill, height: fill, gap: 14 }, [
                  txt('Modules mapped to pain points', 27, COLORS.gold, { style: { bold: true } }),
                  ...[
                    ['ProjectCommand', 'Programme, cost, risk, stage gates, and handover confidence in one live twin.'],
                    ['Evidence Command', 'Accepted proof, rejected evidence, authority documents, and warranty packs tied to gates.'],
                    ['VendorIQ', 'Vendor/package scoring across delivery, quality, evidence, cost, and escalation.'],
                    ['ResidentPortal', 'Handover readiness, snag closure, documents, warranty, and buyer trust.'],
                    ['ESG Evidence', 'Operational proof for sustainability, utilities, initiatives, and reporting readiness.'],
                  ].map(([a, b]) =>
                    row({ width: fill, height: hug, gap: 16, align: 'start' }, [
                      txt(a, 22, COLORS.cyan, { width: fixed(190), style: { bold: true } }),
                      txt(b, 21, COLORS.soft, { width: fill }),
                    ])
                  ),
                  rule({ width: fill, stroke: COLORS.line, weight: 2 }),
                  txt('Measurement targets: float protected, evidence gaps closed, approval blockers surfaced earlier, vendor issue cycle time reduced, handover confidence improved.', 22, COLORS.ink, { width: fill, style: { bold: true } }),
                ]),
              ],
            ),
            txt('Sources: Sobha public site, Sobha Signature Quality, Sobha FY2025 announcement, Sobha Energy Solutions announcement. Assumptions are clearly framed as pilot hypotheses.', 13, COLORS.muted, { width: fill }),
          ],
        ),
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
}

async function exportPresentation(presentation, fileName, previewPrefix) {
  const pptx = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(outDir, fileName);
  await pptx.save(pptxPath);

  const previewPaths = [];
  for (let i = 0; i < presentation.slides.count; i += 1) {
    const slide = presentation.slides.getItem(i);
    const png = await slide.export({ format: 'png' });
    const bytes = Buffer.from(await png.arrayBuffer());
    const previewPath = path.join(previewDir, `${previewPrefix}-${String(i + 1).padStart(2, '0')}.png`);
    await writeFile(previewPath, bytes);
    previewPaths.push(previewPath);
  }
  return { pptxPath, previewPaths };
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });
addDeckSlides(deck);
const deckExport = await exportPresentation(deck, 'sobha_4c360_executive_pitch_deck.pptx', 'slide');

const leaveBehind = Presentation.create({ slideSize: { width: W, height: H } });
addLeaveBehind(leaveBehind);
const leaveExport = await exportPresentation(leaveBehind, 'sobha_4c360_one_page_leavebehind.pptx', 'leavebehind');

const talkTrack = `# Sobha Realty x 4C360 Demo Talk Track

Audience: Sobha executive leadership
Duration: 7 minutes
Claim style: evidence-led; public facts separated from pilot hypotheses

## Opening: 45 seconds
Sobha's public story is quality, backward integration, sustainability, and scaled delivery. The pitch is not that Sobha lacks control. The pitch is that control gets harder to preserve invisibly as project volume, approvals, vendors, evidence, and handovers multiply.

Position 4C360 as the live operating layer that protects Sobha's premium promise at scale.

## Live Demo Path
1. Open ProjectCommand overview.
2. Click Add Project.
3. Use the Sobha Pilot Tower sample document to show AI reading a project summary / LOA-style input.
4. Generate the project control baseline: programme, cost, gates, vendors, risks, obligations, evidence, and forecast.
5. Launch ProjectCommand overview.
6. Trigger Facade Delay.
7. Explain what changes:
   - Health changes
   - SPI drops
   - Float is consumed
   - EAC moves
   - Gate readiness is affected
   - Vendor score is impacted
   - Handover confidence drops
8. Scroll to Cascade Effects.
9. Show the consequence model:
   - If unresolved
   - If resolved today
10. Open DevelopmentX Copilot in ProjectCommand mode.
11. Show the recommended action: release facade long-lead procurement.

## Sobha Translation
For Sobha, replace the demo event with a real package dependency:
- facade procurement
- joinery or POD delivery
- authority approval
- inspection rejection
- commissioning evidence gap
- handover warranty pack delay

The executive value is earlier visibility, cleaner accountability, and faster decisions.

## Discovery Questions
- Which live project has the highest executive attention right now?
- Which handover or stage gate creates the most downstream pressure?
- Where do approval or evidence gaps usually become visible too late?
- Which package or vendor dependency creates the most repeated escalation?
- What would make a weekly executive project review more decision-ready?

## Close
Ask for a 60-minute discovery workshop and one pilot candidate. The pilot should prove whether the live twin helps Sobha protect quality, float, evidence readiness, and handover confidence before issues become executive escalations.
`;

const sourceNotes = `# Sobha Realty Source Notes

## Public facts used
- Sobha publicly positions quality through in-house engineers, craftsmen, technicians, specialists, and a quality control cell reporting to the Group Chairman.
- Sobha Energy Solutions announcement describes backward integration across design, construction, facade, joinery, PODs, facilities/community management, and security, with strict quality and efficiency controls.
- Sobha reported FY2025 sales of AED 30 billion, a 30% year-on-year increase, and 14 developments across the UAE.
- Sobha reported a GRESB 2025 standing investment benchmark score of 97/100 and a 4-Star rating.

## Evidence-led assumptions
- Scaling a premium, vertically integrated development model increases the value of live delivery, evidence, approval, vendor, and handover controls.
- 4C360 should lead with ProjectCommand as the pilot wedge, then expand to VendorIQ, Evidence Command, ResidentPortal, ESG, and portfolio command.
- ROI should be framed as pilot measurement targets until Sobha validates live baseline data.

## Source URLs
- https://sobharealty.com/about
- https://sobharealty.com/about/signature-quality
- https://sobharealty.com/media-center/news/sobha-realty-achieves-aed-30-billion-sales-2025-30-year-year-increase
- https://sobharealty.com/media-center/news/sobha-realty-strengthens-sustainable-commitment-through-sobha-energy-solutions
`;

await writeFile(path.join(outDir, 'sobha_4c360_demo_talk_track.md'), talkTrack, 'utf8');
await writeFile(path.join(outDir, 'sobha_4c360_source_notes.md'), sourceNotes, 'utf8');

console.log(JSON.stringify({
  deck: deckExport.pptxPath,
  deckPreviews: deckExport.previewPaths,
  leaveBehind: leaveExport.pptxPath,
  leaveBehindPreview: leaveExport.previewPaths[0],
  talkTrack: path.join(outDir, 'sobha_4c360_demo_talk_track.md'),
  sourceNotes: path.join(outDir, 'sobha_4c360_source_notes.md'),
}, null, 2));
