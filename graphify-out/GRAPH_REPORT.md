# Graph Report - .  (2026-06-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 367 nodes · 497 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c5e04e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 27 edges
2. `compilerOptions` - 15 edges
3. `api` - 14 edges
4. `LeadStatus` - 11 edges
5. `AnimatedSection()` - 8 edges
6. `Lead` - 7 edges
7. `LEAD_STATUS_LABELS` - 6 edges
8. `scripts` - 5 edges
9. `TransportHeroVisual()` - 5 edges
10. `findCity()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `TimelineStep` --references--> `LeadStatus`  [EXTRACTED]
  src/app/client/page.tsx → src/types/index.ts
- `ClientDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/client/page.tsx → src/context/AuthContext.tsx
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/AuthContext.tsx
- `AdminPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/admin/page.tsx → src/context/AuthContext.tsx
- `ClientSidebar()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/client/layout.tsx → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (35): LOG_COLORS, STATUS_OPTIONS, STATUS_OPTIONS, LOG_STATUS, SOURCE_TYPE_LABELS, STATUS_OPTIONS, SortKey, STATUS_OPTIONS (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (20): SiteFooter(), PHOTOS, CHAOS, PIPELINE, FAQ, EASE, CLIENTS, EASE (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (24): AdminPage(), ClientLayout(), ClientSidebar(), NAV, DashboardLayout(), NAV, ROLE_MAP, Sidebar() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (28): dependencies, @anthropic-ai/sdk, clsx, d3-geo, @floating-ui/react, framer-motion, gsap, @gsap/react (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (11): PHOTOS, MOCK_LEADS, STATS, DONE, NEXT, PROBLEMS, PILLARS, WHAT_WE_DO (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (17): item, REASSURANCES, stagger, CITIES, CITIES_XY, cityById(), CityData, getBusPos() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (12): metadata, ApiResponse, CHIPS, EASE, Fields, Msg, SmoothScrollProvider(), AuthProvider() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (6): APRES, metadata, REASSURANCES, metadata, TIMELINE, Props

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (11): INITIAL_DATA, msgVar, STEPS, Props, CITIES, City, findCity(), normalize() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (10): TabId, TABS, AIResponse, EASE, ExtractedFields, FIELD_LABELS, Message, msgVar (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (9): computeTotal(), DEFAULT_LINE, fieldStyle, labelStyle, ManualQuoteModal(), ModalProps, QuoteLine, TVA_RATES (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/node, @types/react (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (9): CLIENT_LABELS, ClientDashboardPage(), EASE, getTimelineIndex(), isSpecial(), LeadCard(), STATUS_STYLE, TIMELINE (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (4): DashboardPage(), PIPELINE_STAGES, STATUS_DOT, STATUS_LABEL

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (3): CHAOS, EASE, PIPELINE

## Knowledge Gaps
- **168 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 2` to `Community 0`, `Community 13`, `Community 14`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `api` connect `Community 0` to `Community 2`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 14`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07474600870827286 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08392603129445235 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._