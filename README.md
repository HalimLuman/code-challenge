# Interest Matcher

A modern platform for connecting people based on shared interests. Built with Next.js, Tailwind CSS, and Supabase.

---

## 🚀 System Overview

The application enables users to define their interests and discover others with similar profiles, creating a streamlined path from onboarding to interaction.

- **Architecture**  
  The system is built as a full-stack application using the App Router in Next.js.  
  Server and client responsibilities are clearly separated, allowing efficient data fetching, secure API handling, and scalable UI rendering.

- **Database & Authentication**  
  Supabase is used for both database and authentication.  
  Row Level Security (RLS) policies enforce strict access control at the database level, ensuring that users can only access data they are permitted to see.  
  Data fetching is handled through PostgREST, providing a simple and efficient API layer over PostgreSQL.

- **Interest Matching**  
  Matching is implemented through a PostgreSQL function (`get_similar_users`) that computes the intersection of interest tags between users.  
  The logic is executed at the database level for performance and simplicity, while also respecting user-defined privacy settings (Public, Connections-only, Private).

- **Messaging System**  
  Users can communicate in real time once a connection is established.  
  Conversations are automatically initialized upon connection acceptance, ensuring a smooth transition from discovery to interaction without additional user steps.

---

## 🧠 Design Philosophy

The system is designed to prioritize simplicity, clarity, and maintainability, focusing on core functionality rather than unnecessary complexity.

## 🛠 Documentation & Process

My prompting strategy was iterative and high-level, focusing on guiding system design and feature evolution rather than generating isolated code snippets.

- **"System Design Initialization"**  
  I first summarized the requirements in my own words and asked the AI to generate a structured Markdown document describing the system architecture and data flow.  
  This helped establish a clear mental model before writing or generating any code, ensuring that development started from a well-defined foundation rather than ad-hoc implementation.

- **"Core Application Scaffold"**  
  After understanding the architecture, I prompted the AI to generate a minimal working version of the app, including authentication, interest management, and basic matching logic.  
  The prompt was intentionally scoped to “working but simple” to avoid overengineering and to ensure I had a stable base to iterate on.

- **"Incremental Feature Expansion"**  
  Instead of requesting everything at once, I added features step by step through focused prompts, including:
  - Connections system
  - Messaging
  - Notifications
  - Forgot password flow
  - Anonymous interest submission
  - User settings (password, privacy)

  Each prompt was written to integrate with the existing system without breaking previous functionality, emphasizing consistency and separation of concerns.

- **"UI/UX Refinement Prompts"**  
  After the core logic was stable, I shifted focus to UI.  
  I used descriptive prompts (e.g., “clean, modern, minimal, profile-centric layout”) while also correcting specific issues I observed in the generated UI.  
  This allowed me to iteratively improve the interface without micromanaging every styling detail.

- **"Targeted Fix Prompts"**  
  For specific issues (e.g., TypeScript errors, UI inconsistencies, or logic bugs), I used precise prompts describing the problem and expected outcome, the way I described the problem was by mentioning the errors in the terminal, devTools and the expected behavior.  
  This ensured quick resolution without introducing unnecessary changes elsewhere in the codebase.

- **Connection Deletion Reliability**
  My initial implementation relied on the client-side Supabase instance with Row Level Security (RLS) policies. In some cases, deletions failed silently due to misconfigured or overly strict policies in different environments.
  
  To ensure consistent behavior, I refactored the logic to use a server-side Service Role client with explicit permission checks. This removed dependency on client-side RLS correctness for critical actions, while still maintaining security through controlled server logic.

- **Query Structure & Aliasing**
  Initially, I used Supabase’s default relational queries for fetching connection data. However, the returned structure did not align cleanly with the UI component expectations, leading to mapping inconsistencies.
  
  I adjusted the approach by introducing explicit query aliasing (e.g., `sender:profiles!sender_id`), which made the response shape predictable and easier to work with. This improved both readability and maintainability of the data layer.

- **UI Iteration Based on Real Output**
  The first generated UI met functional requirements but lacked clarity and consistency. Instead of regenerating the entire interface, I iteratively refined specific components by identifying concrete issues (layout spacing, hierarchy, feedback states).
  
  This incremental approach allowed controlled improvements without introducing regressions.

  - **Incremental Problem Isolation**
  Rather than attempting to fix the entire system at once, I addressed issues in isolation, prioritizing critical errors such as TypeScript build failures. This reduced cognitive load and ensured each fix was validated before moving forward.

- **Targeted Code Navigation**
  Instead of scanning the entire codebase, I used focused searches (e.g., locating matching logic or API handlers) to work only with relevant parts of the system. This kept prompts concise and avoided unnecessary context expansion.

- **Stepwise Refactoring Strategy**
  For larger changes (such as theme removal), I broke the process into controlled steps:
  1. Update global configuration
  2. Adjust providers
  3. Perform bulk class cleanup
  
  This prevented intermediate broken states and made debugging significantly easier.

- **Prompt Scope Control**
  Prompts were intentionally scoped to specific tasks (e.g., “fix this type issue” vs “refactor the app”), which improved response quality and reduced unintended side effects.

  - **Intentional Simplification**
  I removed the `next-themes` dependency and all `dark:` variants, opting for a single, consistent light theme. This reduced complexity, improved performance, and eliminated issues like flash of unstyled content (FOUC).

- **Pragmatic Matching Logic**
  Instead of implementing a complex AI-based recommendation system, I retained and optimized a SQL-based interest overlap approach.
  
  This decision was based on:
  - Transparency (easy to understand and debug)
  - Performance (handled efficiently at the database level)
  - Scope alignment (sufficient for a minimal system)

- **Feature Prioritization**
  Focus was placed on delivering a complete, end-to-end user flow (auth → interests → matching → messaging) rather than adding advanced but non-essential features.

- **Separation of Concerns**
  Anonymous interest submission was intentionally kept separate from authenticated user data to preserve system clarity and avoid mixing different data ownership models.

  - **Real-Time Interactions**
  Notifications and messaging currently rely on manual fetching. Integrating Supabase Realtime would significantly improve responsiveness and user experience.

- **RLS Policy Refinement**
  While current Row Level Security policies are functional, they could be further refined for scalability, especially around visibility of interests and connections in more complex scenarios.

- **Rate Limiting & Abuse Protection**
  The anonymous interest endpoint could benefit from basic rate limiting or request throttling to prevent misuse.

- **Matching Enhancements**
  The current overlap-based matching could be extended with weighting, ranking, or recency factors to improve relevance as the dataset grows.

- **UI Feedback & States**
  Additional loading, empty, and error states across the app would improve overall usability and polish.
