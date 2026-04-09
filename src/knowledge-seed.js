/**
 * Knowledge Seed Module
 * Pre-loads Buksy's memory with domain knowledge across software engineering,
 * project management, productivity, and communication frameworks.
 */

const SEED_VERSION = 2;

function buildSeedKnowledge() {
  return [
    // ── Software Engineering Principles ──────────────────────────
    {
      title: "SOLID Principles",
      category: "software-engineering",
      content: `The SOLID principles are five design guidelines for writing maintainable and scalable object-oriented code:
1. **Single Responsibility Principle (SRP)** — A class should have only one reason to change. Each module handles one concern.
2. **Open/Closed Principle (OCP)** — Software entities should be open for extension but closed for modification. Use abstractions and interfaces.
3. **Liskov Substitution Principle (LSP)** — Subtypes must be substitutable for their base types without altering program correctness.
4. **Interface Segregation Principle (ISP)** — Clients should not be forced to depend on interfaces they don't use. Prefer many small interfaces.
5. **Dependency Inversion Principle (DIP)** — Depend on abstractions, not concrete implementations. High-level modules should not depend on low-level ones.
When building tasks: Break large features into SRP-aligned tasks. Each task should touch one concern.`,
      tags: ["solid", "design-patterns", "architecture"]
    },
    {
      title: "Clean Code Practices",
      category: "software-engineering",
      content: `Clean code guidelines for building maintainable software:
- **Meaningful names**: Variables, functions, and classes should clearly express intent.
- **Small functions**: Each function should do one thing well and be under 20 lines when possible.
- **DRY (Don't Repeat Yourself)**: Extract repeated logic into shared functions or modules.
- **KISS (Keep It Simple, Stupid)**: Prefer the simplest solution that works correctly.
- **YAGNI (You Aren't Gonna Need It)**: Don't build features until they are actually needed.
- **Boy Scout Rule**: Leave the code cleaner than you found it.
- **Comments**: Code should be self-documenting. Comments explain why, not what.
When planning tasks: Estimate 15-20% extra time for code review and cleanup in every sprint.`,
      tags: ["clean-code", "best-practices", "refactoring"]
    },
    {
      title: "Testing Pyramid & Strategy",
      category: "software-engineering",
      content: `The testing pyramid defines three levels of automated testing:
1. **Unit Tests (70%)** — Fast, isolated tests for individual functions. Run in milliseconds. Use mocks for dependencies.
2. **Integration Tests (20%)** — Test interactions between modules, databases, and APIs. Slower but catch interface bugs.
3. **E2E Tests (10%)** — Full user-flow tests in a browser or API client. Slowest but highest confidence.
Key practices:
- Write tests before or alongside code (TDD/BDD).
- Aim for 80%+ code coverage on critical paths.
- Use test fixtures and factories for consistent data.
- Run unit tests on every commit, integration on every PR, E2E nightly.
When creating tasks: Always include a "Write tests for X" task alongside feature implementation tasks.`,
      tags: ["testing", "tdd", "quality"]
    },
    {
      title: "CI/CD Pipeline Best Practices",
      category: "software-engineering",
      content: `Continuous Integration and Continuous Deployment streamline delivery:
- **CI**: Automatically build and test every commit. Catch regressions immediately.
- **CD**: Automatically deploy to staging after CI passes. Production deploys should be one-click or automated.
Pipeline stages: Lint → Unit Test → Build → Integration Test → Deploy to Staging → Smoke Test → Deploy to Production.
Key rules:
- Trunk-based development: Small, frequent merges to main.
- Feature flags over long-lived branches.
- Rollback plan for every deployment.
- Monitor error rates for 15 minutes after each deploy.
When planning projects: Add CI/CD setup as a task in the first sprint. It pays for itself immediately.`,
      tags: ["ci-cd", "devops", "deployment"]
    },
    {
      title: "Code Review Guidelines",
      category: "software-engineering",
      content: `Effective code review improves quality and spreads knowledge:
- **Review scope**: Keep PRs under 400 lines. Larger PRs get rubber-stamped.
- **Review checklist**: Does it work? Is it readable? Is it tested? Any security issues? Performance concerns?
- **Tone**: Be kind and constructive. Say "Consider..." not "You should...".
- **Turnaround**: Review within 4 hours during business hours. Blocking reviews slow the whole team.
- **Self-review first**: Author should review their own PR before requesting reviews.
When creating tasks: Build in 30-minute review blocks after implementation tasks.`,
      tags: ["code-review", "collaboration", "quality"]
    },
    {
      title: "Technical Debt Management",
      category: "software-engineering",
      content: `Technical debt is the cost of shortcuts taken during development:
Types of debt:
- **Deliberate**: Known shortcuts taken for speed (document and track).
- **Accidental**: Discovered later through growing complexity.
- **Bit rot**: Code that became outdated as requirements evolved.
Management strategy:
- Track debt items in the backlog with "tech-debt" labels.
- Allocate 15-20% of each sprint to paying down debt.
- Prioritize debt that blocks feature velocity.
- Refactor in small, safe increments with test coverage.
When planning: After every 3 feature tasks, include 1 tech-debt cleanup task.`,
      tags: ["tech-debt", "refactoring", "maintenance"]
    },
    {
      title: "API Design Best Practices",
      category: "software-engineering",
      content: `Building clean, maintainable APIs:
REST conventions:
- Use nouns for resources: /api/users, /api/projects
- HTTP verbs: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error
- Pagination: Use cursor-based or offset pagination for list endpoints.
- Versioning: /api/v1/ prefix or Accept header versioning.
Design rules:
- Consistent naming and response shape.
- Always validate input. Never trust the client.
- Rate limiting for public endpoints.
- Include timestamps (createdAt, updatedAt) on all resources.
When building: Create API tasks before UI tasks. The contract comes first.`,
      tags: ["api", "rest", "backend"]
    },
    {
      title: "Git Workflow Best Practices",
      category: "software-engineering",
      content: `Effective Git usage for teams and solo developers:
Branching:
- main: Always deployable.
- feature/*: One branch per feature or bug fix.
- release/*: For release stabilization.
Commit hygiene:
- Write clear, present-tense commit messages: "Add user auth middleware"
- Each commit should be atomic and buildable.
- Squash WIP commits before merging.
Workflow:
1. Create feature branch from main.
2. Make small, frequent commits.
3. Push and create PR when ready.
4. Address review feedback.
5. Squash-merge to main.
6. Delete feature branch.
When planning: Include "Set up Git repo and branch strategy" as a day-1 task.`,
      tags: ["git", "version-control", "workflow"]
    },

    // ── Project Management Frameworks ────────────────────────────
    {
      title: "Agile & Scrum Framework",
      category: "project-management",
      content: `Agile is a mindset; Scrum is a framework for implementing it:
Scrum roles: Product Owner, Scrum Master, Development Team.
Scrum events:
- **Sprint Planning**: Define sprint goal and select backlog items. (2 hours for 2-week sprint)
- **Daily Standup**: 15-minute sync. What I did, what I'll do, any blockers.
- **Sprint Review**: Demo completed work to stakeholders. (1 hour)
- **Sprint Retrospective**: What went well, what didn't, what to improve. (45 minutes)
Sprint rules:
- Fixed length (1-2 weeks typical).
- Sprint backlog is locked after planning.
- Definition of Done must be clear and agreed.
- Velocity = story points completed per sprint. Track for estimation accuracy.
When creating projects: Structure tasks in 2-week sprints. Start with a planning task.`,
      tags: ["agile", "scrum", "sprints"]
    },
    {
      title: "Kanban Method",
      category: "project-management",
      content: `Kanban focus on flow and limiting work-in-progress (WIP):
Core principles:
- Visualize the workflow (columns: Backlog → To Do → In Progress → Review → Done).
- Limit WIP: Max 2-3 items in progress per person. Finish before starting new.
- Measure flow: Track cycle time (start to finish) and throughput (items per week).
- Continuously improve: If bottlenecks appear, address root causes.
Best for: Maintenance work, support teams, continuous delivery, and personal task management.
When using Buksy: Your open tasks are your Kanban board. Buksy limits WIP through adaptive capacity.`,
      tags: ["kanban", "flow", "wip"]
    },
    {
      title: "Sprint Planning & Estimation",
      category: "project-management",
      content: `Estimation techniques for accurate project planning:
Story Points:
- Relative sizing (1, 2, 3, 5, 8, 13). Compare tasks to each other, not absolute time.
- 1 point = trivial change. 13 points = needs to be broken down.
Time estimates:
- Add 30% buffer for unknowns.
- Track actual vs. estimated to calibrate over time.
Planning rules:
- Break tasks under 4 hours of work (anything larger needs decomposition).
- Identify dependencies first and resolve blockers before sprint starts.
- Over-capacity? Cut scope, not quality.
- Under-capacity? Pull from backlog or pay down tech debt.
When building task lists: Buksy uses duration estimates (in minutes) for capacity planning.`,
      tags: ["estimation", "planning", "story-points"]
    },
    {
      title: "Risk Management Framework",
      category: "project-management",
      content: `Identifying and mitigating project risks:
Risk categories:
- **Technical**: Unfamiliar technology, unclear requirements, integration complexity.
- **Schedule**: Unrealistic deadlines, scope creep, dependency delays.
- **Resource**: Team availability, skill gaps, burnout.
- **External**: Third-party API changes, vendor reliability, market shifts.
Risk assessment matrix:
- Impact (1-5) × Probability (1-5) = Risk Score.
- Score > 15: Must mitigate immediately.
- Score 10-15: Create contingency plan.
- Score < 10: Monitor and accept.
Mitigation strategies:
- Avoid: Remove the risk source entirely.
- Mitigate: Reduce probability or impact.
- Transfer: Insurance, outsourcing, or contracts.
- Accept: Document and monitor.
When planning: For every project with > 5 tasks, add a "Risk assessment" task at the start.`,
      tags: ["risk", "planning", "mitigation"]
    },
    {
      title: "Work Breakdown Structure (WBS)",
      category: "project-management",
      content: `WBS decomposes a project into manageable chunks:
Structure:
Level 1: Project goal (e.g., "Launch App")
Level 2: Major phases (Scope, Build, Polish, Launch)
Level 3: Deliverables within each phase
Level 4: Individual tasks (each should be 1-8 hours of work)
Rules:
- Every deliverable at level 3 must have at least 2 tasks.
- Sum of task durations in each phase should equal the phase estimate.
- 100% rule: WBS must capture all work. Nothing is outside the tree.
When building plans: Buksy uses this structure for goal roadmaps. Each goal phase maps to a WBS level.`,
      tags: ["wbs", "decomposition", "planning"]
    },
    {
      title: "Stakeholder Communication Plan",
      category: "project-management",
      content: `Keeping stakeholders informed reduces surprises:
Communication matrix:
- **Daily**: Team standup (internal).
- **Weekly**: Status update email/report to stakeholders.
- **Bi-weekly**: Sprint demo to product owner and key stakeholders.
- **Monthly**: Roadmap review with leadership.
Status update template:
1. What was accomplished this week.
2. What's planned for next week.
3. Risks or blockers needing attention.
4. Key metrics (velocity, completion rate, bug count).
Rules:
- Bad news travels fast. Escalate risks early.
- Use visuals: charts and graphs over walls of text.
- Match detail to audience: executives want summary, team wants details.
When creating projects: Add recurring "Write status update" tasks every Friday.`,
      tags: ["communication", "stakeholders", "reporting"]
    },

    // ── Launch Planning ──────────────────────────────────────────
    {
      title: "Pre-Launch Checklist Template",
      category: "launch-planning",
      content: `Comprehensive pre-launch checklist for software products:
Technical:
□ All critical user flows tested end-to-end
□ Performance benchmarks meet targets (page load < 3s)
□ Security audit completed (OWASP top 10 checked)
□ Database migrations tested on staging
□ Monitoring and alerting configured
□ Rollback procedure documented and tested
□ SSL/HTTPS configured
□ Error logging and crash reporting active
Product:
□ Core feature set matches MVP scope
□ Onboarding flow tested with 3+ external users
□ Empty states, error states, and edge cases handled
□ Copy reviewed for clarity and tone
□ Analytics/tracking events configured
Marketing:
□ Landing page live with clear value proposition
□ Social media announcements drafted
□ Launch email to existing contacts prepared
□ Help docs or FAQ available
Operations:
□ Support channel active (email, chat, or forum)
□ Post-launch monitoring schedule (who watches the first 48 hours)
□ Success metrics defined (signups, activation, retention targets)
When building launch plans: Buksy uses this checklist as the foundation.`,
      tags: ["launch", "checklist", "pre-launch"]
    },
    {
      title: "Go-To-Market Strategy Framework",
      category: "launch-planning",
      content: `Planning your launch for maximum impact:
Phase 1 — Pre-launch (2-4 weeks before):
- Build a landing page with email capture.
- Reach out to 10-20 potential early adopters personally.
- Create 3-5 pieces of content explaining the problem you solve.
- Prepare demo video or walkthrough.
Phase 2 — Launch day:
- Post on Product Hunt, Hacker News, relevant communities.
- Send launch email to collected contacts.
- Engage with every early comment and piece of feedback.
- Monitor server health and error rates closely.
Phase 3 — Post-launch (2 weeks after):
- Collect and categorize all feedback.
- Ship quick wins (< 1 day fixes) within the first week.
- Publish a "Week 1" update showing traction and responsiveness.
- Plan the next iteration based on actual user behavior.
Key metrics to track:
- Signup rate, activation rate, retention at day 7.
- Time to first value (how long until user gets the "aha" moment).
- NPS or satisfaction score from early users.`,
      tags: ["go-to-market", "launch", "marketing"]
    },
    {
      title: "Beta Testing Strategy",
      category: "launch-planning",
      content: `Running an effective beta test:
Planning:
- Define beta goals: Find bugs? Validate UX? Test scaling?
- Recruit 10-50 beta testers (mix of power users and newcomers).
- Prepare a feedback collection method (form, Slack channel, or in-app widget).
- Set a beta duration (2-4 weeks typical).
During beta:
- Release with known limitations documented.
- Weekly check-in with beta users.
- Track: bugs reported, features requested, confusion points.
- Ship critical fixes during beta, batch non-critical ones.
After beta:
- Synthesize feedback into themes.
- Prioritize fixes by frequency × severity.
- Write a beta summary and share with team.
- Graduate beta testers to "founding users" status.
When building plans: Include beta as a distinct phase between Build and Launch.`,
      tags: ["beta", "testing", "feedback"]
    },

    // ── Productivity Frameworks ──────────────────────────────────
    {
      title: "Eisenhower Matrix for Prioritization",
      category: "productivity",
      content: `The Eisenhower Matrix sorts tasks by urgency and importance:
Quadrant 1 — Urgent + Important: DO FIRST. Crises, deadlines, critical bugs.
Quadrant 2 — Not Urgent + Important: SCHEDULE. Strategic work, learning, relationship building.
Quadrant 3 — Urgent + Not Important: DELEGATE. Interruptions, most emails, some meetings.
Quadrant 4 — Not Urgent + Not Important: ELIMINATE. Social media, busywork, time-wasters.
Key insight: Most people spend too much time in Q1 and Q3. The goal is to maximize time in Q2.
When Buksy priorities tasks:
- High priority + due date = Q1 → Do first.
- High priority + no due date = Q2 → Schedule proactively.
- Low priority + due date = Q3 → Quick execution or defer.
- Low priority + no due date = Q4 → Consider deleting.`,
      tags: ["prioritization", "eisenhower", "decision-making"]
    },
    {
      title: "Time Boxing & Pomodoro Technique",
      category: "productivity",
      content: `Time boxing increases focus and prevents perfectionism:
Pomodoro method:
1. Choose a task.
2. Set timer for 25 minutes (one "pomodoro").
3. Work without interruption until timer rings.
4. Take a 5-minute break.
5. After 4 pomodoros, take a 15-30 minute break.
Time boxing variation:
- Assign each task a time box (30, 60, 90, or 120 minutes).
- When the time box ends, STOP regardless of completion state.
- Review: Is it good enough? Or does it need another time box?
Benefits:
- Reduces analysis paralysis (just start the timer).
- Creates urgency that improves focus.
- Measurable: "I did 6 pomodoros today" is concrete.
When Buksy plans tasks: Duration estimates (in minutes) serve as time boxes.`,
      tags: ["pomodoro", "time-management", "focus"]
    },
    {
      title: "Energy Management Over Time Management",
      category: "productivity",
      content: `Managing energy is more important than managing hours:
Energy types:
- **Physical**: Sleep, exercise, nutrition. Foundation for everything else.
- **Emotional**: Relationships, stress levels, sense of purpose.
- **Mental**: Focus, creativity, decision-making capacity.
- **Spiritual**: Alignment with values, meaning in work.
Daily energy pattern (for most people):
- Morning (8-12): Peak cognitive energy. Do deep, creative work.
- Afternoon (13-15): Post-lunch dip. Light tasks, meetings, admin.
- Late afternoon (15-17): Second wind. Good for collaboration and review.
- Evening (18+): Wind down. Planning, reading, low-effort tasks.
Key strategies:
- Match task difficulty to energy levels (Buksy does this automatically).
- Protect your peak hours from meetings and interruptions.
- Take real breaks (not phone scrolling). Walk, stretch, rest eyes.
- Track energy over a week to find your personal patterns.
When checking in: Your energy/focus check-in helps Buksy match tasks to your current state.`,
      tags: ["energy", "focus", "health"]
    },
    {
      title: "Weekly Review Process",
      category: "productivity",
      content: `A weekly review keeps you aligned and reduces anxiety:
The GTD Weekly Review (adapted):
1. **Capture** (10 min): Dump everything on your mind into Buksy. Tasks, ideas, worries.
2. **Clarify** (10 min): Turn vague items into clear next actions.
3. **Organize** (10 min): Assign categories, priorities, due dates, and projects.
4. **Reflect** (10 min): Review goals. Are tasks aligned? Any drift?
5. **Engage** (5 min): Pick the top 3 priorities for next week.
Schedule it: Same time every week (Friday afternoon or Sunday evening works well).
Track: After 4 weekly reviews, look for patterns in what keeps getting deferred.
When planning: Add a recurring "Weekly review" task every Friday with 45-minute duration.`,
      tags: ["review", "gtd", "planning"]
    },
    {
      title: "Deep Work vs. Shallow Work",
      category: "productivity",
      content: `Cal Newport's framework for managing cognitive work:
Deep work: Cognitively demanding tasks that create value and require focus.
Examples: Writing code, designing architecture, writing proposals, learning new skills.
Rules: Block 2-4 hour windows. No email, no Slack, no notifications. Full concentration.
Shallow work: Logistically necessary but low cognitive demand.
Examples: Email, scheduling, status updates, routine admin, most meetings.
Rules: Batch into specific windows. Don't let them fragment deep work time.
Balance:
- Aim for 3-4 hours of deep work per day (more is diminishing returns).
- Schedule shallow work in the post-lunch dip or end of day.
- Say no to meetings that don't need you.
When Buksy schedules: High-effort, high-priority tasks = deep work slots. Low-effort = shallow work slots.`,
      tags: ["deep-work", "focus", "productivity"]
    },

    // ── Communication Templates ──────────────────────────────────
    {
      title: "Status Update Template",
      category: "communication",
      content: `Professional status update format:
Subject: [Project Name] — Week [N] Update
1. **Highlights**: 2-3 key accomplishments this week.
2. **In Progress**: What's actively being worked on.
3. **Upcoming**: What's planned for next week.
4. **Risks/Blockers**: Anything that needs attention or help.
5. **Metrics**: Key numbers (velocity, completion rate, bug count).
Keep it to 5-10 sentences. Link to details rather than inlining them.
Audience-specific:
- Executives: Lead with outcomes and risks. Skip implementation details.
- Team: Include technical details and decisions made.
- Clients: Focus on deliverables and timeline confidence.`,
      tags: ["communication", "status-update", "template"]
    },
    {
      title: "Meeting Structure Best Practices",
      category: "communication",
      content: `Running meetings that don't waste time:
Before:
- Every meeting needs a clear agenda shared 24 hours ahead.
- Define the desired outcome: Decision? Information sharing? Brainstorm?
- Invite only people who need to be there (max 7 for decisions, 2-3 ideal).
During:
- Start on time. Don't wait for latecomers.
- Assign a facilitator and a note-taker.
- Time-box each agenda item.
- End 5 minutes early for action items.
After:
- Send notes within 2 hours with: Decisions made, action items (who/what/when), next meeting date.
Common meeting types and ideal durations:
- Standup: 15 minutes
- Decision meeting: 30 minutes
- Brainstorm: 45-60 minutes
- Sprint planning: 60-90 minutes
- Retrospective: 45 minutes`,
      tags: ["meetings", "communication", "efficiency"]
    },

    // ── Architecture & Design ────────────────────────────────────
    {
      title: "Microservices vs. Monolith Decision Guide",
      category: "software-engineering",
      content: `Choosing the right architecture for your project:
Start with a monolith when:
- Team is small (< 5 developers).
- Domain is not well understood yet.
- Speed of iteration matters more than scale.
- You're building an MVP or v1.
Consider microservices when:
- Team is large enough to own separate services.
- Clear domain boundaries exist (e.g., payments, notifications, user management).
- Different parts need to scale independently.
- you need independent deployment of components.
Migration path:
1. Build monolith first with clean internal modules.
2. Identify natural service boundaries from usage patterns.
3. Extract one service at a time, starting with the most independent.
4. Use API gateway for routing and service discovery.
Common mistakes: Starting with microservices too early, sharing databases between services, not investing in monitoring.`,
      tags: ["architecture", "microservices", "monolith"]
    },
    {
      title: "Database Schema Design Principles",
      category: "software-engineering",
      content: `Designing databases that scale and maintain:
Core principles:
- Normalize to 3NF for transactional data. Denormalize for read-heavy analytics.
- Every table gets: id (primary key), created_at, updated_at.
- Use foreign keys to enforce relationships.
- Index columns used in WHERE, JOIN, and ORDER BY clauses.
Naming:
- Tables: plural, snake_case (users, project_tasks).
- Columns: singular, snake_case (email, due_date).
- Foreign keys: [table]_id (user_id, project_id).
Migration rules:
- Always write reversible migrations.
- Test migrations on a copy of production data.
- Never rename or delete columns in production without a deprecation period.
Performance:
- Use EXPLAIN ANALYZE on slow queries.
- Add indexes based on actual query patterns, not guesses.
- Consider read replicas for heavy read workloads.`,
      tags: ["database", "schema", "sql"]
    },

    // ── Security ─────────────────────────────────────────────────
    {
      title: "Application Security Checklist",
      category: "software-engineering",
      content: `Essential security practices for web applications:
Authentication:
- Hash passwords with bcrypt (cost factor 12+).
- Use secure, HttpOnly, SameSite cookies for sessions.
- Implement rate limiting on login endpoints.
- Support 2FA for sensitive accounts.
Authorization:
- Check permissions on every API endpoint. Never trust the client.
- Use role-based access control (RBAC) for multi-user systems.
- Validate that user owns the resource they're accessing.
Data:
- Validate and sanitize all input (SQL injection, XSS, CSRF).
- Use parameterized queries, never string concatenation for SQL.
- Encrypt sensitive data at rest and in transit (TLS).
- Never log passwords, tokens, or personal data.
Infrastructure:
- Keep dependencies updated (npm audit weekly).
- Use environment variables for secrets, never commit them.
- Enable CORS only for trusted origins.
When planning: Add a "Security review" task before any launch.`,
      tags: ["security", "owasp", "authentication"]
    },

    // ── Sprint Templates ─────────────────────────────────────────
    {
      title: "Two-Week Sprint Template",
      category: "project-management",
      content: `Template for a standard 2-week development sprint:
Day 1: Sprint Planning
- Review and prioritize backlog items.
- Select items for the sprint based on team velocity.
- Break items into tasks with time estimates.
- Identify and resolve any blockers upfront.
Days 2-5: Execution Week 1
- Focus on highest-priority items first.
- Daily standups to surface blockers.
- Start code reviews early (don't batch at end).
Days 6-8: Execution Week 2
- Continue execution. Mid-sprint check on velocity.
- If behind: Cut scope, not corners.
- Begin integration testing for completed features.
Day 9: Polish & Test
- Bug fixes and edge cases.
- Final code reviews and merges.
- Prepare demo for sprint review.
Day 10: Review & Retro
- Sprint Review: Demo work to stakeholders (30 min).
- Sprint Retrospective: What to improve (30 min).
- Backlog grooming for next sprint (30 min).
Velocity tracking: After 3 sprints, your average velocity becomes reliable for planning.`,
      tags: ["sprint", "template", "planning"]
    },

    // ── Personal Development ─────────────────────────────────────
    {
      title: "Learning Strategy: The 70-20-10 Model",
      category: "productivity",
      content: `Effective professional development breakdown:
70% — Learning by doing:
- Build side projects, contribute to open source.
- Take on stretch assignments at work.
- Pair program with someone more experienced.
20% — Learning from others:
- Code reviews (both giving and receiving).
- Mentorship (find a mentor AND be a mentor).
- Tech talks, meetups, and conferences.
- Read other people's code (open source repos).
10% — Formal learning:
- Online courses, books, certifications.
- Structured tutorials and workshops.
- Documentation deep-dives.
Key: Consistency beats intensity. 30 minutes of daily learning compounds dramatically.
When planning: Include 1-2 learning tasks per week (tagged "learning" category).`,
      tags: ["learning", "development", "growth"]
    },

    // ── Burnout Prevention ───────────────────────────────────────
    {
      title: "Burnout Prevention & Recovery",
      category: "productivity",
      content: `Recognizing and preventing burnout:
Warning signs:
- Chronic exhaustion that doesn't improve with rest.
- Cynicism or detachment from work you used to enjoy.
- Reduced productivity despite working more hours.
- Physical symptoms: headaches, sleep issues, illness.
Prevention strategies:
- Set hard boundaries on work hours. Log off at a consistent time.
- Take real vacations (not "working vacations").
- Say no to non-essential commitments.
- Regular exercise, even just 20-minute walks.
- Social connection outside of work.
Recovery:
- Reduce workload immediately. Talk to your manager or clients.
- Take at least 1 full day off per week with zero work.
- Reconnect with what motivated you originally.
- Consider professional support if symptoms persist.
When Buksy detects low energy + scattered focus repeatedly:
It should reduce task load automatically and suggest a lighter day.`,
      tags: ["burnout", "health", "wellbeing"]
    },

    // ── Project Lifecycle ────────────────────────────────────────
    {
      title: "Software Project Lifecycle Phases",
      category: "project-management",
      content: `Standard phases of a software project:
1. **Discovery** (1-2 weeks): Define the problem, target user, and success metrics.
2. **Planning** (1 week): Create WBS, estimate effort, assign resources, identify risks.
3. **Design** (1-2 weeks): Architecture, wireframes, data model, API contracts.
4. **Development** (2-8 weeks): Build in sprints. Continuous integration and testing.
5. **Testing** (1-2 weeks): QA, performance testing, security audit, UAT.
6. **Launch** (1 week): Staged rollout, monitoring, documentation.
7. **Iteration** (ongoing): Collect feedback, fix issues, ship improvements.
Key rule: Phases overlap in practice. Design continues during development. Testing starts from day 1.
Time allocation (typical): 10% Discovery, 10% Planning, 15% Design, 40% Development, 15% Testing, 10% Launch.
When creating project roadmaps: Buksy uses this lifecycle to structure phases automatically.`,
      tags: ["lifecycle", "phases", "planning"]
    },

    // ── Estimation ───────────────────────────────────────────────
    {
      title: "Software Estimation Techniques",
      category: "project-management",
      content: `Getting better at estimating work:
Techniques:
- **T-shirt sizing**: S/M/L/XL for rough planning. S=1-2hrs, M=half day, L=full day, XL=multi-day.
- **Planning poker**: Team consensus using Fibonacci sequence (1,2,3,5,8,13).
- **Three-point estimation**: Optimistic + Most likely + Pessimistic / 3 = Estimate.
- **Historical comparison**: "This is similar to X which took Y days."
Rules of thumb:
- Multiply your first instinct by 1.5x for tasks you've done before.
- Multiply by 2x for tasks involving new technology.
- Multiply by 3x for tasks with vague requirements.
- Break down anything estimated at > 8 hours.
Tracking:
- Record actual time alongside estimates.
- After 10+ tasks, calculate your estimation accuracy ratio.
- Adjust future estimates based on historical bias.
When Buksy creates tasks: Duration estimates include buffer based on effort and category history.`,
      tags: ["estimation", "planning", "effort"]
    },

    // ── Deployment & Operations ──────────────────────────────────
    {
      title: "Deployment Strategies",
      category: "software-engineering",
      content: `Common deployment strategies and when to use them:
**Rolling deployment**: Replace instances one by one. Zero downtime but slow rollback.
**Blue-Green deployment**: Two identical environments. Switch traffic between them. Instant rollback.
**Canary deployment**: Route 5-10% of traffic to new version. Monitor, then scale up.
**Feature flags**: Deploy code but toggle features on/off. Most flexible.
Recommended approach for small teams:
1. Use feature flags for new features.
2. Deploy to staging first, run smoke tests.
3. Blue-green to production with 5-minute monitoring window.
4. Rollback if error rate exceeds 1% increase.
Monitoring after deploy:
- Watch error rates, latency, and CPU/memory for 15 minutes.
- Check key user flows work correctly.
- Have a rollback command ready (one-click or one-command).`,
      tags: ["deployment", "devops", "operations"]
    },

    // ── Task Decomposition ───────────────────────────────────────
    {
      title: "Task Decomposition Guide",
      category: "productivity",
      content: `Breaking large tasks into actionable steps:
The SMART criterion for tasks:
- **Specific**: "Build login form" not "Work on auth."
- **Measurable**: Clear done criteria. "Form submits and redirects to dashboard."
- **Achievable**: Within your skill set or clearly scoped learning.
- **Relevant**: Moves a project or goal forward.
- **Time-bound**: Has a duration estimate and optional due date.
Decomposition rules:
- If a task takes more than 2 hours, break it into subtasks.
- Each subtask should be completable in one sitting.
- Name tasks as actions: "Write", "Design", "Test", "Review", "Deploy".
- Include preparation tasks: "Research X before building Y."
Common task patterns:
1. Research → Design → Implement → Test → Deploy
2. Draft → Review → Revise → Publish
3. Identify → Prioritize → Execute → Validate
When Buksy builds to-do lists: It follows this decomposition pattern automatically.`,
      tags: ["decomposition", "tasks", "planning"]
    },

    // ── NEW: DevOps & Infrastructure ────────────────────────────
    {
      title: "Docker & Containerization Best Practices",
      category: "software-engineering",
      content: `Containerizing applications effectively:
Dockerfile best practices:
- Use minimal base images (alpine, distroless) to reduce attack surface.
- Multi-stage builds: Build in one stage, copy artifacts to lean runtime stage.
- Never run containers as root. Use USER directive.
- Pin image versions explicitly (node:20-alpine, not node:latest).
- Group RUN commands with && to minimize layers.
- Use .dockerignore to exclude node_modules, .git, test files.
Docker Compose patterns:
- Define services, networks, and volumes in docker-compose.yml.
- Use profiles for dev/staging/prod variations.
- Health checks for service readiness.
- Named volumes for persistent data (databases).
Production rules:
- Always set resource limits (memory, CPU).
- Use restart policies (on-failure or always).
- Centralize logging (stdout/stderr → log aggregator).
- Scan images for vulnerabilities (docker scout, trivy).
When planning: Add "Dockerize application" as a task in the CI/CD setup phase.`,
      tags: ["docker", "containers", "devops"]
    },
    {
      title: "Kubernetes Fundamentals for Developers",
      category: "software-engineering",
      content: `Core Kubernetes concepts developers should know:
Key resources:
- **Pod**: Smallest deployable unit. Contains one or more containers.
- **Deployment**: Manages Pod replicas with rolling updates.
- **Service**: Stable network endpoint for a set of Pods (ClusterIP, NodePort, LoadBalancer).
- **ConfigMap/Secret**: External configuration and sensitive data.
- **Ingress**: HTTP routing and TLS termination.
Development workflow:
1. Write Dockerfile for your application.
2. Create Kubernetes manifests (Deployment + Service).
3. Use namespaces to isolate environments (dev, staging, prod).
4. Health checks: livenessProbe for restart, readinessProbe for traffic.
5. Resource requests and limits for every container.
When NOT to use Kubernetes:
- Solo projects or small teams with < 5 services.
- When Heroku, Railway, or Fly.io solve the problem simpler.
- When the team lacks Kubernetes operational expertise.
When planning: Only include K8s tasks if the project genuinely needs orchestration at scale.`,
      tags: ["kubernetes", "devops", "infrastructure"]
    },
    {
      title: "Cloud Architecture Patterns",
      category: "software-engineering",
      content: `Common cloud architecture patterns for scalable applications:
**Serverless**: Use FaaS (Lambda, Cloud Functions) for event-driven workloads. No servers to manage.
Best for: APIs with variable traffic, webhooks, scheduled jobs, image processing.
**Queue-based**: Decouple producers from consumers with message queues (SQS, RabbitMQ, Redis Streams).
Best for: Email sending, notifications, batch processing, async workflows.
**Event-driven**: Services communicate via events (Kafka, EventBridge).
Best for: Microservices, real-time data pipelines, audit trails.
**CQRS**: Separate read and write paths for different optimization.
Best for: Apps with complex queries or high read-to-write ratios.
**CDN-first**: Serve static assets and cached API responses from edge locations.
Best for: Content-heavy sites, global traffic distribution.
Cost optimization:
- Use spot/preemptible instances for non-critical workloads.
- Right-size instances based on actual resource usage.
- Set up billing alerts and review costs monthly.
When planning: Choose the simplest architecture that meets your needs. Over-engineering kills velocity.`,
      tags: ["cloud", "architecture", "serverless"]
    },
    {
      title: "Monitoring & Observability Strategy",
      category: "software-engineering",
      content: `Three pillars of observability:
1. **Logs**: Structured JSON logs with correlation IDs. Ship to ELK, Datadog, or CloudWatch.
2. **Metrics**: Counter and gauge measurements. Track: request rate, error rate, latency (RED method).
3. **Traces**: Distributed tracing for multi-service request flows (OpenTelemetry, Jaeger).
Key metrics to track:
- **RED**: Rate (requests/sec), Errors (error %), Duration (latency percentiles).
- **USE**: Utilization, Saturation, Errors for infrastructure resources.
- **Golden signals**: Latency, traffic, errors, saturation.
Alerting rules:
- Alert on symptoms (high error rate), not causes (high CPU).
- Use severity levels: P1 (immediate), P2 (business hours), P3 (next sprint).
- Avoid alert fatigue: If an alert fires but needs no action, delete or tune it.
Dashboards:
- One overview dashboard per service.
- Business metrics dashboard for stakeholders.
- On-call dashboard for incident response.
When planning: Include monitoring setup as a task in the first sprint of any production service.`,
      tags: ["monitoring", "observability", "devops"]
    },

    // ── NEW: Frontend Engineering ────────────────────────────────
    {
      title: "React Architecture & Patterns",
      category: "software-engineering",
      content: `Building maintainable React applications:
Component design:
- Keep components small and focused (< 100 lines).
- Separate presentational (UI) from container (logic) components.
- Use custom hooks to extract reusable logic.
- Prefer composition over prop drilling.
State management hierarchy:
1. Local state (useState) for component-specific data.
2. Context API for shared UI state (theme, auth, locale).
3. Server state libraries (React Query, SWR) for API data.
4. Global store (Zustand, Redux Toolkit) only for complex cross-cutting state.
Performance:
- React.memo for expensive pure components.
- useMemo/useCallback for expensive computations and stable references.
- Code splitting with React.lazy and Suspense.
- Virtualize long lists (react-window, react-virtualized).
Testing:
- Use React Testing Library for component tests (test behavior, not implementation).
- Mock API calls with MSW (Mock Service Worker).
- Snapshot tests are fragile; prefer assertion-based tests.
When building: Structure features as folders with index.js, components/, hooks/, and utils/.`,
      tags: ["react", "frontend", "components"]
    },
    {
      title: "Web Performance Optimization",
      category: "software-engineering",
      content: `Making web applications fast:
Core Web Vitals:
- **LCP (Largest Contentful Paint)**: < 2.5s. Optimize images, fonts, and critical CSS.
- **FID (First Input Delay)**: < 100ms. Minimize JavaScript execution on the main thread.
- **CLS (Cumulative Layout Shift)**: < 0.1. Set explicit dimensions for images and ads.
Optimization techniques:
- **Bundle splitting**: Separate vendor code from app code. Lazy-load routes.
- **Image optimization**: Use WebP/AVIF, responsive srcset, lazy loading.
- **Font optimization**: Use font-display: swap, preload critical fonts.
- **Caching**: Cache API responses (Cache-Control headers), use service workers for offline.
- **Compression**: Enable gzip/brotli on server responses.
- **Prefetching**: Preload next-page resources for instant navigation.
Measuring:
- Lighthouse audits in CI/CD pipeline.
- Real User Monitoring (RUM) with Web Vitals API.
- Compare against competitor benchmarks.
When building: Add a "Performance audit" task before every major release.`,
      tags: ["performance", "web-vitals", "optimization"]
    },
    {
      title: "Accessibility (a11y) Guidelines",
      category: "software-engineering",
      content: `Building inclusive web applications (WCAG 2.1 AA):
Core principles (POUR):
- **Perceivable**: Provide text alternatives for non-text content. Ensure sufficient color contrast (4.5:1 ratio).
- **Operable**: All functionality available via keyboard. Provide enough time to read and interact.
- **Understandable**: Consistent navigation. Clear labels and error messages.
- **Robust**: Compatible with assistive technologies (screen readers, voice control).
Common fixes:
- All images need alt text (decorative images get alt="").
- Form inputs need associated labels or aria-label.
- Use semantic HTML (button, nav, main, article) instead of div-everything.
- Focus indicators must be visible. Never use outline: none without replacement.
- Heading hierarchy: h1 → h2 → h3. Never skip levels.
Testing:
- Use axe DevTools extension in browser.
- Navigate with keyboard only (Tab, Enter, Space, Escape).
- Test with VoiceOver (Mac) or NVDA (Windows).
When planning: Include an "Accessibility review" task in every UI sprint.`,
      tags: ["accessibility", "a11y", "wcag"]
    },

    // ── NEW: Backend Patterns ────────────────────────────────────
    {
      title: "Caching Strategies",
      category: "software-engineering",
      content: `Choosing the right caching strategy:
Cache layers:
1. **Browser cache**: HTTP Cache-Control headers. Best for static assets.
2. **CDN cache**: Edge caching for geographically distributed users.
3. **Application cache**: In-memory (Redis, Memcached) for computed results.
4. **Database cache**: Query result caching, materialized views.
Invalidation strategies:
- **TTL (Time-to-Live)**: Simple. Set expiry time. Good for rarely-changing data.
- **Write-through**: Update cache on every write. Consistent but slower writes.
- **Write-behind**: Queue cache updates for async processing. Fast writes, eventual consistency.
- **Cache-aside**: Application checks cache first, loads from DB on miss, writes to cache.
Patterns to avoid:
- Caching without considering invalidation (stale data).
- Over-caching (memory pressure, cold-start problems).
- Missing cache stampede protection (use locks or request coalescing).
When planning: Add caching as a task only when performance measurements indicate the need.`,
      tags: ["caching", "redis", "performance"]
    },
    {
      title: "Message Queue & Event-Driven Architecture",
      category: "software-engineering",
      content: `Decoupling services with asynchronous messaging:
When to use queues:
- Sending emails, SMS, or push notifications.
- Processing uploads (images, videos, documents).
- Batch operations (reports, exports, data migrations).
- Inter-service communication in microservices.
Popular options:
- **Redis Streams/BullMQ**: Great for Node.js, simple setup.
- **RabbitMQ**: Mature, feature-rich, good for complex routing.
- **SQS**: AWS managed, serverless-friendly, at-least-once delivery.
- **Kafka**: High throughput, event sourcing, log-based.
Design rules:
- Messages should be idempotent (safe to process twice).
- Use dead-letter queues (DLQ) for failed messages.
- Monitor queue depth and consumer lag.
- Consumer should acknowledge after successful processing, not before.
Event-driven patterns:
- **Pub/Sub**: Multiple subscribers process the same event independently.
- **CQRS + Event Sourcing**: Store events as the source of truth, derive read models.
When building: If a task says "send email after X", it needs a queue, not a synchronous call.`,
      tags: ["queues", "async", "event-driven"]
    },
    {
      title: "Authentication & Authorization Patterns",
      category: "software-engineering",
      content: `Securing modern applications:
Authentication methods:
- **Session-based**: Server stores session state. Simple, stateful. Good for web apps.
- **JWT (JSON Web Tokens)**: Stateless. Good for APIs and microservices. Short-lived tokens + refresh tokens.
- **OAuth 2.0**: Delegate authentication to a provider (Google, GitHub). Use for social login.
- **OIDC (OpenID Connect)**: Extension of OAuth for identity. Standard for SSO.
Authorization patterns:
- **RBAC (Role-Based Access Control)**: Users have roles (admin, editor, viewer). Roles have permissions.
- **ABAC (Attribute-Based Access Control)**: Policies based on attributes (department, location, time).
- **ReBAC (Relationship-Based Access Control)**: Permissions based on entity relationships (Google Zanzibar pattern).
Security rules:
- Access tokens: short-lived (15 min), stored in memory or HttpOnly cookies.
- Refresh tokens: long-lived (7 days), stored securely, rotated on use.
- Always validate tokens server-side. Never trust client-side token checking.
- Implement token revocation for logout and compromised tokens.
When planning: Auth is a sprint-0 task. Never bolt it on later.`,
      tags: ["auth", "jwt", "oauth", "security"]
    },

    // ── NEW: Product Management ──────────────────────────────────
    {
      title: "Product Discovery Framework",
      category: "product-management",
      content: `Validating ideas before building:
Discovery process:
1. **Problem framing**: Who has this problem? How severe is it? How often does it occur?
2. **User research**: Interview 5-10 potential users. Listen for pain points, not feature requests.
3. **Opportunity assessment**: Market size, competition, feasibility, alignment with vision.
4. **Prototype & test**: Build the simplest version that tests the riskiest assumption.
5. **Decide**: Build it, kill it, or pivot based on evidence.
Frameworks:
- **Jobs to be Done (JTBD)**: "When [situation], I want to [motivation], so I can [outcome]."
- **Impact/Effort Matrix**: Plot features on a 2x2 for prioritization.
- **RICE Score**: Reach × Impact × Confidence / Effort = Priority score.
Validation metrics:
- Willingness to pay (pricing page test).
- Signup rate from landing page.
- Task completion rate in prototype.
- Pre-order or waitlist conversion.
When creating projects: Start with a 1-week discovery phase. Don't skip the "should we build this?" question.`,
      tags: ["product", "discovery", "validation"]
    },
    {
      title: "Product Metrics & KPIs",
      category: "product-management",
      content: `Measuring product success:
Pirate Metrics (AARRR):
1. **Acquisition**: How do users find you? (Traffic, signups, install rate)
2. **Activation**: Do they have a good first experience? (Onboarding completion, time to first value)
3. **Retention**: Do they come back? (DAU/MAU, cohort retention, churn rate)
4. **Revenue**: Do they pay? (MRR, ARPU, LTV, conversion rate)
5. **Referral**: Do they tell others? (NPS, viral coefficient, referral rate)
North Star Metric:
- One metric that captures the core value your product delivers.
- Examples: Slack = messages sent, Airbnb = nights booked, Spotify = time listening.
- All team work should ladder up to moving this metric.
Anti-patterns:
- Vanity metrics (total signups without activation context).
- Too many metrics (pick 3-5 key ones per quarter).
- Measuring outputs (features shipped) instead of outcomes (user behavior changed).
When building products: Define success metrics BEFORE writing code. Add tracking as day-1 tasks.`,
      tags: ["metrics", "kpis", "product"]
    },
    {
      title: "Roadmap Planning & Feature Prioritization",
      category: "product-management",
      content: `Building effective product roadmaps:
Roadmap types:
- **Now/Next/Later**: Time-agnostic. "Now" = this sprint, "Next" = this quarter, "Later" = future.
- **Outcome-based**: Organized by goals ("Improve retention by 20%"), not features.
- **Theme-based**: Grouped by strategic themes ("Platform stability", "Growth", "Expansion").
Prioritization frameworks:
- **MoSCoW**: Must have, Should have, Could have, Won't have.
- **ICE Score**: Impact (1-10) × Confidence (1-10) × Ease (1-10) = Score.
- **Kano Model**: Basic (must be there), Performance (more is better), Delight (unexpected value).
Saying no:
- If it doesn't move a current quarter goal, defer it.
- "Not now" is better than "never" for stakeholder relationships.
- Build a "parking lot" for good ideas that aren't timely.
Review cadence:
- Weekly: Check sprint progress against roadmap.
- Monthly: Adjust priorities based on new data.
- Quarterly: Major roadmap revision with stakeholder input.
When using Buksy: Projects map to roadmap themes. Goals map to quarterly objectives.`,
      tags: ["roadmap", "prioritization", "product"]
    },

    // ── NEW: UX & Design ────────────────────────────────────────
    {
      title: "User Research Methods",
      category: "product-management",
      content: `Research methods for understanding users:
Qualitative (understanding why):
- **User interviews**: 30-60 min conversations. Ask about problems, not solutions.
- **Contextual inquiry**: Watch users do their work in their environment.
- **Usability testing**: Give tasks, observe struggles. 5 users find 85% of issues.
- **Card sorting**: Users organize content into categories they expect.
Quantitative (measuring what):
- **Surveys**: Large-scale data collection. Keep to 5-10 questions max.
- **A/B tests**: Compare two versions with real traffic. Need statistical significance.
- **Analytics**: Track user flows, drop-off points, feature usage.
- **Heatmaps**: Visualize where users click, scroll, and hover.
Research planning rules:
- Research is not validation seeking. Be open to being wrong.
- 5 interviews per persona segment is usually sufficient for patterns.
- Record sessions (with permission) for team review.
- Synthesize findings into actionable insights, not raw transcripts.
When building: Include "User research" as a task in the Discovery phase of every project.`,
      tags: ["ux", "research", "users"]
    },
    {
      title: "Design System Fundamentals",
      category: "software-engineering",
      content: `Building and maintaining a design system:
Core components:
- **Typography scale**: 4-6 sizes with clear hierarchy (heading, subheading, body, caption).
- **Color palette**: Primary, secondary, semantic (success, warning, error), neutral scale.
- **Spacing scale**: Consistent spacing system (4px base: 4, 8, 12, 16, 24, 32, 48, 64).
- **Components**: Button, Input, Card, Modal, Table, Badge, Alert. Build once, use everywhere.
Design tokens:
- Store design decisions as variables (colors, spacings, radii, shadows).
- Platform-agnostic: Same tokens for web, mobile, email.
- Version and document every token change.
Implementation rules:
- Components must be accessible by default.
- Dark mode support from day one (use semantic color tokens).
- Document usage guidelines and examples (Storybook).
- Never override design system styles inline. Create variants instead.
Governance:
- Design system is a product. It needs an owner and a backlog.
- Contributions from the team, but one person curates.
- Breaking changes need migration guides and deprecation periods.
When building: "Set up design system" is a day-1 task for any frontend project.`,
      tags: ["design-system", "ui", "components"]
    },

    // ── NEW: Data Engineering & ML ──────────────────────────────
    {
      title: "Data Pipeline Architecture",
      category: "software-engineering",
      content: `Building reliable data pipelines:
Pipeline types:
- **Batch**: Process large volumes on a schedule (daily ETL jobs). Tools: Airflow, dbt, Spark.
- **Streaming**: Process events in real-time. Tools: Kafka, Flink, Kinesis.
- **ELT**: Extract data to warehouse first, then transform. Modern approach (dbt + Snowflake/BigQuery).
Pipeline design rules:
- **Idempotent**: Running a pipeline twice produces the same result.
- **Observable**: Log row counts, timestamps, and data quality metrics.
- **Testable**: Unit tests for transformations, integration tests for end-to-end.
- **Recoverable**: If a step fails, resume from that step (don't re-run everything).
Data quality checks:
- Schema validation (expected columns and types).
- Uniqueness constraints on key fields.
- Freshness checks (data arrived within expected window).
- Volume checks (row count within expected range).
When planning: Add data pipeline tasks to the "Design" phase. Data architecture decisions are hard to change later.`,
      tags: ["data", "pipeline", "etl"]
    },
    {
      title: "Machine Learning Project Lifecycle",
      category: "software-engineering",
      content: `Shipping ML from experiment to production:
Phases:
1. **Problem definition**: What business metric will ML improve? Is ML even the right approach?
2. **Data collection**: Gather, clean, and label data. This is 60-80% of the work.
3. **Exploration**: EDA, feature engineering, baseline model. Use notebooks.
4. **Training**: Experiment with architectures and hyperparameters. Track with MLflow or W&B.
5. **Evaluation**: Metrics beyond accuracy: precision, recall, F1, AUC. Test on holdout set.
6. **Deployment**: Model serving (API endpoint, batch prediction, edge inference).
7. **Monitoring**: Track model drift, data drift, prediction distribution changes.
MLOps principles:
- Version your data, code, AND models.
- Automate training pipelines (retrain on new data).
- A/B test models in production before full rollout.
- Have a fallback (rule-based system) for model failures.
When planning: ML projects are inherently uncertain. Plan in iterations, not waterfalls.`,
      tags: ["ml", "machine-learning", "mlops"]
    },

    // ── NEW: Mobile Development ─────────────────────────────────
    {
      title: "Mobile App Development Strategy",
      category: "software-engineering",
      content: `Choosing the right mobile development approach:
Options:
- **Native (Swift/Kotlin)**: Best UX and performance. Highest cost (2 codebases).
- **Cross-platform (React Native/Flutter)**: 80-90% code sharing. Good for most apps.
- **Progressive Web App (PWA)**: Web technology. Works offline. No app store needed.
- **Hybrid (Capacitor/Cordova)**: Web app wrapped in native shell. Simplest but limited.
Decision guide:
- Choose native if: Complex animations, AR/VR, hardware-intensive (games, camera).
- Choose cross-platform if: Content-focused apps, startup speed matters, small team.
- Choose PWA if: Simple utility apps, no need for native APIs, budget constraint.
Mobile-specific considerations:
- Offline-first design (sync when connected).
- Battery and data usage optimization.
- App store review guidelines (1-3 days for iOS review).
- Push notification strategy (don't abuse it).
- Deep linking for marketing and re-engagement.
When planning: Include "Platform choice decision" as a task in the Discovery phase.`,
      tags: ["mobile", "react-native", "flutter"]
    },

    // ── NEW: Advanced Project Management ─────────────────────────
    {
      title: "Scope Management & Scope Creep Prevention",
      category: "project-management",
      content: `Managing scope to deliver on time:
Scope definition:
- Write a clear project charter: What's in scope, what's NOT in scope.
- Use user stories: "As a [user], I want [feature] so I can [value]."
- Define MVP: The smallest version that delivers core value.
- Document assumptions and constraints upfront.
Scope creep signals:
- "Can we just add one more thing?" (without dropping something else).
- Requirements that grow with each stakeholder conversation.
- No formal change request process.
- Moving goalposts on "done" criteria.
Prevention strategies:
- Change request process: Document impact, get approval, adjust timeline.
- Freeze requirements after sprint planning.
- "Yes, and..." technique: "Yes, we can add that in a future sprint."
- Track requirement changes: If > 20% change from original, re-plan.
When building task lists: Lock scope in the planning task. Any additions trigger a scope review task.`,
      tags: ["scope", "management", "planning"]
    },
    {
      title: "Team Velocity & Capacity Planning",
      category: "project-management",
      content: `Using velocity to predict delivery:
Measuring velocity:
- Count story points (or tasks) completed per sprint.
- Track for at least 3 sprints before relying on velocity for predictions.
- Use rolling average (last 3 sprints) for stability.
Capacity planning:
- Available capacity = Team size × Sprint days × Focus factor (0.7-0.8).
- Never plan to 100% capacity. Leave 20% buffer for bugs, meetings, and unexpected work.
- Account for holidays, vacations, on-call rotations.
Common mistakes:
- Comparing velocity across teams (it's team-specific).
- Padding estimates "just in case" (track actual vs. estimate instead).
- Using velocity as a performance metric (it's a planning tool, not a judgment).
Improving velocity:
- Reduce WIP (finish before starting new).
- Remove blockers faster (daily standup action items).
- Invest in automation (CI/CD, testing, tooling).
- Reduce meeting load (protect focus time).
When planning in Buksy: Your completion velocity is tracked automatically and used for schedule predictions.`,
      tags: ["velocity", "capacity", "planning"]
    },
    {
      title: "Dependency Management in Projects",
      category: "project-management",
      content: `Managing task and project dependencies:
Dependency types:
- **Finish-to-Start (FS)**: Task B can't start until Task A is done. Most common.
- **Start-to-Start (SS)**: Tasks can start together but one needs the other to begin.
- **External**: Depends on someone outside the team (vendor, API, legal).
- **Resource**: Multiple tasks need the same person or tool.
Management rules:
- Map dependencies in planning, not during execution.
- Critical path = Longest chain of dependent tasks. This determines the project end date.
- External dependencies need more buffer (2x the estimated wait time).
- Identify blockers daily in standups and resolve within 24 hours.
Risk mitigation:
- Parallelize independent work streams.
- Front-load risky or uncertain tasks.
- Create "spike" tasks for unknowns (timeboxed research before committing).
- Have a Plan B for external dependencies.
When building task lists: Use the dependsOn field to link tasks. Buksy will factor this into scheduling.`,
      tags: ["dependencies", "planning", "critical-path"]
    },

    // ── NEW: Launch Deep Tactics ─────────────────────────────────
    {
      title: "Post-Launch Operations Playbook",
      category: "launch-planning",
      content: `Managing the critical first 30 days after launch:
Week 1 — Stabilization:
- Monitor error rates and performance every 2 hours.
- Respond to every user support request within 4 hours.
- Ship critical bug fixes within 24 hours.
- Send a "thank you for trying" email to early adopters.
- Collect and categorize all feedback (bugs, UX issues, feature requests).
Week 2 — Quick Wins:
- Ship 3-5 "quick win" improvements (< 1 day each) based on feedback.
- Publish a "Week 1 update" blog post showing responsiveness.
- Interview 5 active users for deeper insights.
- Begin A/B testing onboarding flow improvements.
Weeks 3-4 — Iteration Planning:
- Synthesize all feedback into themes.
- Plan v1.1 scope (bug fixes + top 3 feature requests).
- Set up automated user surveys (NPS at day 7 and day 30).
- Share data-driven update with stakeholders.
Success criteria at 30 days:
- Error rate < 1%.
- Day-7 retention > 40%.
- NPS > 30.
- At least 3 organic referrals.
When building: Create a "Post-launch operations" task list as part of the launch phase.`,
      tags: ["launch", "operations", "post-launch"]
    },
    {
      title: "Landing Page Conversion Framework",
      category: "launch-planning",
      content: `Building landing pages that convert visitors to users:
Above the fold (first screen):
- Clear headline: State the main benefit in < 10 words.
- Sub-headline: Explain how you deliver that benefit.
- CTA button: One clear action ("Start Free", "Get Started", "Try Now").
- Social proof: Logos, testimonials, or numbers ("10,000+ teams use us").
Page structure:
1. Hero section (headline + CTA + visual/screenshot).
2. Pain point section ("Tired of [problem]?").
3. Solution section ("Here's how [product] solves it").
4. Features (3-5 key features with benefits, not specs).
5. Social proof (testimonials, case studies, logos).
6. Pricing (if applicable) or second CTA.
7. FAQ (address top 3-5 objections).
Conversion optimization:
- One page, one goal. Remove navigation links to other pages.
- Form fields: Fewer = better. Start with email-only.
- Page speed: < 3 seconds load time. Every second costs 7% conversions.
- Mobile-first: 60%+ of traffic is mobile.
When planning: Add "Build landing page" as a pre-launch task with a specific conversion target.`,
      tags: ["landing-page", "conversion", "marketing"]
    },

    // ── NEW: Soft Skills & Leadership ───────────────────────────
    {
      title: "Technical Leadership Skills",
      category: "productivity",
      content: `Growing as a technical leader:
Technical skills:
- Architecture decisions: Make them reversible when possible.
- Technical debt awareness: Know when to pay it, when to accumulate it.
- System design: Understand trade-offs at scale (consistency vs. availability, latency vs. throughput).
Leadership skills:
- **Decision making**: Gather input, decide quickly, commit fully. Disagree and commit.
- **Communication**: Translate technical complexity for non-technical stakeholders.
- **Mentoring**: Pair with junior engineers. Review their code thoughtfully.
- **Delegation**: Trust the team. Only intervene for direction, not execution.
Anti-patterns:
- Hero culture: Don't be the only person who can fix things.
- Perfectionism paralysis: Ship good enough, iterate toward great.
- Avoiding conflict: Address disagreements directly and kindly.
Growth path:
- IC (Individual Contributor) track: Staff → Principal → Distinguished Engineer.
- Management track: Tech Lead → Engineering Manager → Director → VP.
When planning: Include leadership development tasks (1:1s, mentoring, writing RFCs) in your schedule.`,
      tags: ["leadership", "growth", "management"]
    },
    {
      title: "Remote Work Best Practices",
      category: "productivity",
      content: `Thriving as a remote developer:
Workspace:
- Dedicated work area (even if small). Don't work from bed or couch.
- Good internet connection (wired if possible).
- External monitor, quality headset, ergonomic chair.
Communication:
- Over-communicate in async channels (Slack, email). Context is everything.
- "Working out loud": Share progress updates without being asked.
- Camera on for important meetings. Camera off for focus blocks is fine.
- Document decisions in writing. Verbal agreements get lost.
Productivity:
- Time-block your calendar: Deep work blocks are sacred.
- Start and end work at consistent times.
- Take real breaks: Walk, stretch, step outside.
- Avoid the trap of "always being available."
Team rituals:
- Daily async standup (text-based, posted by 10am).
- Weekly video check-in (30 min, mix of work and personal).
- Virtual coffee chats with random teammates (15 min).
When planning: Account for timezone differences in task coordination. Use async by default.`,
      tags: ["remote", "productivity", "communication"]
    },

    // ── NEW: Error Handling & Resilience ─────────────────────────
    {
      title: "Error Handling & Resilience Patterns",
      category: "software-engineering",
      content: `Building systems that handle failure gracefully:
Error handling principles:
- Fail fast: Detect errors early and report clearly.
- Never swallow errors silently. Log, alert, or retry.
- Use structured error responses: { error: string, code: string, details?: object }.
- Distinguish client errors (4xx) from server errors (5xx).
Resilience patterns:
- **Retry with backoff**: Exponential backoff + jitter for transient failures.
- **Circuit breaker**: Stop calling a failing service. Try again after cooldown.
- **Timeout**: Every external call needs a timeout. Default: 5-15 seconds.
- **Bulkhead**: Isolate failures to prevent cascading. Separate thread pools/queues per service.
- **Fallback**: Serve cached data or degraded response when primary source fails.
- **Graceful degradation**: Turn off non-essential features to protect core functionality.
Implementation:
- Use try/catch at service boundaries, not every function.
- Central error handler middleware for consistent error responses.
- Health check endpoints for load balancers and monitoring.
- Chaos engineering: Intentionally inject failures to test resilience (Gremlin, Chaos Monkey).
When planning: Include "Error handling & graceful degradation" as a task in every backend feature.`,
      tags: ["errors", "resilience", "availability"]
    },

    // ── NEW: Developer Experience ───────────────────────────────
    {
      title: "Developer Experience (DX) Best Practices",
      category: "software-engineering",
      content: `Making development faster and more enjoyable:
Local development:
- One command to start the entire dev environment (docker compose up or npm run dev).
- Hot reload/HMR for instant feedback.
- Working seed data for local development (no empty database).
- README with setup instructions that actually work (test on a fresh machine).
Code quality automation:
- Linting: ESLint/Prettier configured once, enforced via pre-commit hooks.
- Type checking: TypeScript or JSDoc types for better IDE support.
- Formatting: Auto-format on save. Stop debating code style.
- Commit hooks: lint-staged + husky for pre-commit checks.
Documentation:
- Architecture Decision Records (ADRs) for significant choices.
- API documentation (generated from code when possible).
- Runbooks for common operations (deploy, rollback, debug).
- Onboarding guide for new team members (first day checklist).
Developer velocity metrics:
- Time from branch creation to production deploy.
- PR review turnaround time.
- Build/test time.
- Developer satisfaction surveys.
When building: Invest in DX early. 1 hour of tooling setup saves 100 hours of friction later.`,
      tags: ["dx", "tooling", "developer-experience"]
    },

    // ── NEW: API Integration Patterns ───────────────────────────
    {
      title: "Third-Party API Integration Guide",
      category: "software-engineering",
      content: `Integrating with external APIs reliably:
Before integration:
- Read the API docs completely. Check rate limits, authentication, and versioning.
- Check the API's status page and uptime history.
- Understand the pricing model. Estimate monthly cost at your expected usage.
- Find client libraries but validate they're maintained.
Implementation:
- Create an abstraction layer between your code and the API.
- Handle authentication centrally (token refresh, rotation).
- Implement rate limiting on your side (don't hit their limits).
- Use exponential backoff for retries with jitter.
- Log all API calls (request/response) for debugging (redact secrets).
Error handling:
- Map external errors to your error format.
- Circuit breakers for unreliable APIs.
- Fallback data or graceful degradation when API is down.
- Webhooks: Validate signatures, handle idempotently, respond quickly (< 5s).
Production:
- Monitor API response times and error rates.
- Set up alerts for API degradation.
- Test with sandbox/staging environments before production.
- Have a migration plan if the API shuts down or changes terms.
When planning: Each API integration should have: research, implement, test, and monitor tasks.`,
      tags: ["api", "integration", "third-party"]
    }
  ];
}

function getSeedVersion() {
  return SEED_VERSION;
}

module.exports = { buildSeedKnowledge, getSeedVersion, SEED_VERSION };
