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

---

## 1. Prompts Used

My prompting strategy was iterative and focused on system-level thinking rather than isolated feature generation.

- **System Design Initialization**  
  I first summarized the requirements in my own words and asked the AI to generate a structured Markdown document describing the system architecture and data flow.  
  This helped establish a clear mental model before writing or generating any code.

- **Core Application Scaffold**  
  I then prompted the AI to generate a minimal working version of the app, including authentication, interest management, and basic matching logic.  
  The goal was to create a stable foundation first, rather than over-engineering early.

- **Incremental Feature Expansion**  
  Features were added step-by-step through focused prompts:
  - Connections system  
  - Messaging  
  - Notifications  
  - Forgot password flow  
  - Anonymous interest submission  
  - Settings (password, privacy, etc.)

  Each prompt was scoped to integrate safely with existing functionality.

- **UI/UX Refinement Prompts**  
  I used descriptive prompts such as “clean, modern, minimal UI with profile-centric layout” and refined outputs iteratively based on actual UI behavior.

- **Targeted Fix Prompts**  
  For bugs or type issues, I used precise prompts describing the problem and expected behavior, avoiding unnecessary refactors.

---

## 2. Iteration & Problem Solving

- **Connection Delete Issue**  
  Initially, deletion was implemented using the client-side Supabase instance with RLS policies. In some cases, deletions failed silently due to environment-specific policy inconsistencies.  
  I refactored the logic to use a server-side Service Role client with explicit permission checks, ensuring consistent behavior across environments.

- **Query Aliasing**  
  The first version of the connections query relied on default Supabase relationships, which produced inconsistent data shapes.  
  I resolved this by introducing explicit aliases (e.g. `sender:profiles!sender_id`), making the response structure predictable and easier to map in the UI.

- **Messaging Settings Debugging (Key Challenge)**  
  During development, messaging behavior did not match expected settings logic.

  Instead of guessing fixes, I investigated the system using:
  - Browser DevTools (network tab)
  - Terminal logs from API calls
  - Inspection of actual Supabase responses

  This allowed me to identify a mismatch between expected and returned data structure.

  After understanding the real issue, I refined the prompt with precise context about the bug, which resulted in a correct and stable implementation.

---

## 3. Context Efficiency

- **Incremental Debugging**  
  I isolated issues one at a time, starting with critical build and type errors before moving to UI improvements.

- **Targeted Code Search**  
  Instead of loading the full codebase into context, I used focused searches to locate relevant logic (e.g. matching function, messaging API).

- **Step-by-Step Refactoring**  
  Larger changes (such as theme removal) were broken into phases:
  1. Update global config  
  2. Adjust providers  
  3. Remove utility classes  

  This prevented breaking the app during transitions.

- **Scoped Prompts**  
  Prompts were kept narrow and task-specific to avoid unintended side effects.

---

## 4. Decision Making

- **Simplification**  
  I removed `next-themes` and all dark mode utilities to reduce complexity and eliminate visual inconsistencies such as flash of unstyled content (FOUC).

- **Matching Strategy**  
  Instead of implementing a complex recommendation system, I used a SQL-based intersection approach.  
  This decision was made for:
  - Simplicity  
  - Performance  
  - Transparency of results  

- **Feature Prioritization**  
  Focus was placed on completing the full user flow:
  authentication → interests → matching → messaging → connections

- **Separation of Concerns**  
  Anonymous interest submissions were kept fully separate from authenticated user data to maintain clear system boundaries.

---

## ⚠️ Potential Improvements

- **Real-time Notifications**  
  Notifications are currently fetched on demand. Supabase Realtime could improve responsiveness.

- **RLS Hardening**  
  Row Level Security policies could be further refined for more granular access control at scale.

- **Rate Limiting**  
  The anonymous interest API could benefit from basic rate limiting to prevent abuse.

- **Matching Improvements**  
  The current overlap-based matching could be extended with ranking or weighting for better relevance.

- **UI Feedback States**  
  Additional loading, empty, and error states would improve user experience consistency.

---

## 🧠 Final Note

The system was built through an iterative AI-assisted workflow, combining structured prompting with manual debugging and real system observation. This allowed rapid development while maintaining control over architecture and correctness.
