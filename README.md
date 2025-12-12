# Laudato Si' Campus Growth Initiative

## Overview

The Laudato Si' Campus Growth Initiative is an interactive web platform designed to foster environmental awareness and engagement at Universidad de Manila (UMak). The application visualizes collective environmental action through a dynamic 3D plant that grows as users contribute by answering ecological questions and making pledges. The system provides real-time feedback, creating a shared experience that encourages sustained participation and community building around sustainability goals.

## Objectives

### Primary Goals

1. **Environmental Education**: Provide accessible content about sustainability, climate action, and ecological responsibility through interactive questions and pledges.

2. **Community Engagement**: Unite the campus community around a shared environmental vision by visualizing collective contributions in real-time.

3. **Behavioral Change**: Encourage daily sustainable practices by limiting contributions to one per day, fostering consistent rather than sporadic engagement.

4. **Visual Impact**: Transform abstract concepts of environmental action into tangible, observable growth through an interactive 3D visualization system.

### Target Outcomes

- Increased awareness of environmental issues among students and faculty
- Daily engagement with sustainability concepts
- Creation of a campus-wide shared experience around environmental action
- Data collection for institutional sustainability metrics

## User Experience

### For Contributors (Students & Faculty)

#### Initial Access

1. Users discover the platform through QR codes displayed around campus or via the public display screen.
2. Upon scanning, they are directed to the main interface where they can observe the current growth stage of the campus plant.
3. Authentication is required via Google sign-in to ensure one contribution per user per day.

#### Contributing Process

1. **Authentication**: Sign in using institutional Google account credentials.
2. **Question Selection**: The system presents an environmental question (multiple choice quiz or open-ended pledge).
3. **Submission**: User provides their answer or pledge statement.
4. **Immediate Feedback**: The plant visibly responds to the contribution, and the user sees their name added to the contributor ticker.
5. **Daily Limit**: After contributing, the user receives confirmation that they have completed their daily action and can return the next day.

#### Viewing Experience

Users can access two distinct views:

- **Interactive View** (Main Page): Personal contribution interface with authentication
- **Public Display View** (Display Page): Large-screen visualization intended for public spaces showing real-time growth, contributor names, and seasonal/time-of-day effects

### Visual Feedback System

The plant progresses through four distinct growth stages based on total campus contributions:

- **Seed Stage** (0-9 contributions): Initial germination phase
- **Sprout Stage** (10-49 contributions): Early growth with visible leaves
- **Plant Stage** (50-199 contributions): Established foliage and branching structure
- **Tree Stage** (200+ contributions): Mature tree with full canopy and fruit-bearing capability

The visualization incorporates real-world temporal context:

- **Time of Day**: Lighting adapts from sunrise through day, dusk, and night based on the local time
- **Seasons**: Environmental elements (flowers, leaves, snow, ground cover) reflect the current month's season
- **Weather Effects**: Seasonal particle systems simulate falling leaves in autumn and snow in winter

## Developer Guide

### Architecture

The application follows a modern web architecture with clear separation between presentation, data management, and authentication layers.

#### Technology Stack

**Frontend Framework**: Next.js 14 with React 18, providing server-side rendering and optimal performance through automatic code splitting and route optimization.

**3D Visualization**: React Three Fiber wraps Three.js in a React-friendly API, enabling declarative 3D scene composition with automatic memory management and lifecycle handling.

**Authentication**: NextAuth.js manages OAuth 2.0 flows with Google as the identity provider, handling session management and secure credential storage.

**Database**: Supabase (PostgreSQL) provides real-time data synchronization through WebSocket connections, eliminating the need for manual polling.

**Styling**: Tailwind CSS enables utility-first styling with custom theming capabilities, while Framer Motion handles animations and transitions.

### Database Schema

#### Core Tables

**users**

- Stores user profiles from Google authentication
- Tracks last contribution timestamp for rate limiting
- Fields: id, email, name, avatar_url, created_at, last_contribution

**questions**

- Contains environmental questions and pledges
- Supports both multiple-choice quizzes and open-ended pledges
- Fields: id, type, question, options, correct_answer, placeholder, is_active

**contributions**

- Records each user submission with timestamp
- Links users to questions with their provided answers
- Fields: id, user_id, question_id, answer, is_correct, created_at

**plant_stats**

- Singleton table maintaining global growth metrics
- Auto-updates via database triggers on new contributions
- Fields: id, total_contributions, current_stage, updated_at

#### Data Flow

1. User submits answer → API route validates authentication and rate limit
2. Contribution inserted into database → Trigger automatically updates plant_stats
3. Supabase broadcasts change → All connected clients receive real-time update via WebSocket
4. React components re-render with new data → 3D plant transitions to new state

### Key Components

#### Real-time Data Hooks (`useRealtime.ts`)

Custom hooks establish persistent connections to Supabase, subscribing to database changes and updating local state automatically. This eliminates API polling and ensures instantaneous updates across all clients.

#### 3D Plant System (`ThreePlant.tsx`)

Procedural generation algorithm creates unique tree structures based on contribution count. The system uses recursive branching with deterministic randomness (seeded hashing) to ensure consistent appearance across sessions while maintaining visual complexity.

Seasonal environment system manages:

- Ground material transitions (soil to snow)
- Particle systems (falling leaves, snowflakes)
- Flower blooming and wilting cycles
- Dynamic lighting based on time and season

#### Seasonal Lighting (`SeasonalLighting`)

Calculates sun/moon position using time-based trigonometry to simulate realistic celestial movement. Light intensity and color temperature adjust dynamically, creating natural transitions between dawn, day, dusk, and night phases.

### API Routes

**POST /api/contributions**

- Validates user session and enforces one-contribution-per-day limit
- Creates contribution record and returns updated plant statistics
- Returns 429 status if user already contributed today

**GET /api/questions**

- Retrieves active questions from database
- No authentication required for question viewing

**POST /api/auth/[...nextauth]**

- Handles OAuth flows with Google
- Creates or updates user records on successful authentication

### Environment Configuration

Required environment variables:

```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development Workflow

1. **Local Setup**: Clone repository and install dependencies via npm
2. **Database Migration**: Execute schema.sql against Supabase instance
3. **Environment Configuration**: Populate .env.local with required credentials
4. **Development Server**: Run `npm run dev` to start on localhost:3000
5. **Production Build**: Execute `npm run build` followed by `npm start`

### Security Considerations

- Row Level Security (RLS) policies enforce data access rules at the database level
- Server-side session validation prevents unauthorized API access
- Rate limiting implemented via timestamp comparison in contributions table
- OAuth tokens never exposed to client-side code
- HTTPS required for authentication flows in production

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│                                                                   │
│  ┌────────────────┐        ┌───────────────────────────────┐   │
│  │   Next.js App  │◄──────►│   React Three Fiber (3D)      │   │
│  │   (React UI)   │        │   - Procedural Plant          │   │
│  └───────┬────────┘        │   - Seasonal Environment      │   │
│          │                 │   - Dynamic Lighting          │   │
│          │                 └───────────────────────────────┘   │
└──────────┼───────────────────────────────────────────────────────┘
           │
           │ HTTPS
           │
┌──────────┼───────────────────────────────────────────────────────┐
│          │              Next.js API Routes                        │
│          │                                                         │
│  ┌───────▼────────┐     ┌──────────────┐    ┌───────────────┐  │
│  │  /api/auth     │     │ /api/contrib │    │ /api/questions│  │
│  │  (NextAuth)    │     │   -utions    │    │               │  │
│  └────────┬───────┘     └──────┬───────┘    └───────┬───────┘  │
│           │                    │                     │           │
└───────────┼────────────────────┼─────────────────────┼───────────┘
            │                    │                     │
            │ OAuth 2.0          │ Real-time WS        │ PostgreSQL
            │                    │                     │
   ┌────────▼─────────┐  ┌──────▼─────────────────────▼────────┐
   │  Google OAuth    │  │         Supabase Platform            │
   │  Identity Provider│  │  ┌─────────────────────────────┐   │
   └──────────────────┘  │  │    PostgreSQL Database       │   │
                         │  │  - users                     │   │
                         │  │  - questions                 │   │
                         │  │  - contributions             │   │
                         │  │  - plant_stats               │   │
                         │  └─────────────────────────────┘   │
                         │  ┌─────────────────────────────┐   │
                         │  │   Real-time Engine          │   │
                         │  │   (WebSocket broadcasts)    │   │
                         │  └─────────────────────────────┘   │
                         └─────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action → Authentication Check → Database Write → Trigger Execution
                                                              │
                                                              ▼
Supabase Broadcast ← Stats Update ← plant_stats Table ← increment_stats()
        │
        ▼
WebSocket Clients (All Users) → React State Update → UI Re-render
```

## Growth Stage Visualization

```
Contributions:    0 ────► 10 ────► 50 ─────► 200 ─────► ∞
                  │        │        │          │
Stage:         [Seed]  [Sprout]  [Plant]    [Tree]
                  │        │        │          │
Visual:           •        🌱       🪴        🌳
                          +2       +15        +50+
                        leaves   branches    fruits
```

## Future Enhancements

### Short-term Improvements

1. **Gamification Layer**: Implement achievement badges for consistent participation streaks, environmental milestone celebrations, and personal contribution history.

2. **Social Features**: Enable users to view their contribution ranking, share their pledges with the campus community, and form sustainability teams or groups.

3. **Analytics Dashboard**: Develop administrative interface showing contribution trends, popular question types, peak engagement times, and demographic insights.

4. **Content Management**: Create admin portal for dynamically adding questions, updating seasonal themes, and managing system announcements without code deployment.

### Medium-term Enhancements

1. **Mobile Application**: Develop native iOS and Android versions with push notifications for daily reminders and milestone achievements.

2. **Multi-campus Support**: Extend platform to support multiple institutions, each with independent plants, allowing for inter-campus competitions or collaborations.

3. **Advanced Visualizations**: Introduce additional plant species based on campus location, climate data integration for realistic seasonal timing, and augmented reality features for mobile devices.

4. **Integration Capabilities**: Connect with campus sustainability systems, environmental sensors, and institutional reporting frameworks for comprehensive impact assessment.

### Long-term Vision

1. **Educational Curriculum Integration**: Develop lesson plans, discussion guides, and classroom activities that leverage the platform for formal environmental education courses.

2. **Research Platform**: Enable academic research on behavior change, community engagement patterns, and the effectiveness of visualization-based environmental education.

3. **Sustainability Marketplace**: Connect platform to local environmental initiatives, allowing users to convert virtual contributions into real-world actions like tree planting or campus beautification projects.

4. **Open Source Ecosystem**: Release the platform as an open-source project with comprehensive documentation, enabling other institutions to deploy and customize their own versions.

## Conclusion

The Laudato Si' Campus Growth Initiative represents a convergence of environmental education, community engagement, and modern web technology. By transforming individual actions into collective visual growth, the platform creates meaningful connections between abstract environmental concepts and tangible outcomes. The system's architecture prioritizes scalability, real-time responsiveness, and maintainability, ensuring long-term viability as the campus community grows and environmental awareness deepens.

For technical support or contribution guidelines, please contact the development team or refer to the project repository documentation.
