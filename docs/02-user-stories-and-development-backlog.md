# INHOD User Stories and Development Backlog

Version: 1.0
Date: 2026-05-21
Status: Draft for planning

## 1. Backlog Conventions

Priority labels:

- P0: Required for MVP launch.
- P1: Important for first stable release.
- P2: Valuable enhancement after core launch.
- P3: Future or optional.

Status labels:

- Ready: Clear enough for implementation planning.
- Needs Detail: Requires product or business decision before implementation.

User story format:

As a [role], I want [capability], so that [outcome].

## 2. Product Epics

1. Authentication and onboarding.
2. User profiles and discovery data.
3. Location management.
4. Community creation and management.
5. Community joining, payments, and rejoin policy.
6. Social feed and engagement.
7. Events and meetups.
8. Chat and realtime communication.
9. Notifications.
10. Safety, reports, and moderation.
11. Moderator wallet and payouts.
12. Super Admin dashboard.
13. Analytics.
14. Future monetization.

## 3. MVP User Stories

### Epic 1: Authentication and Onboarding

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| AUTH-001 | P0 | As a user, I want to register with my mobile number using OTP, so that I can securely access the app. | User can enter mobile number, receive OTP, verify OTP, and create an account linked to Firebase UID. | Ready |
| AUTH-002 | P0 | As a user, I want to log in with mobile OTP, so that I can access my existing account. | Existing user can verify OTP and receive an authenticated app session. | Ready |
| AUTH-003 | P0 | As a blocked user, I should be prevented from logging in, so that abusive accounts cannot access the platform. | Backend checks account status after Firebase verification and denies blocked or suspended users. | Ready |
| AUTH-004 | P0 | As a new user, I want to complete my profile after OTP verification, so that I can join communities and receive relevant suggestions. | Required profile fields are enforced before the user can access the app home. | Ready |
| AUTH-005 | P1 | As a user, I want to update my FCM device token, so that I can receive push notifications on my current device. | App registers, updates, and removes device tokens on login/logout. | Ready |

### Epic 2: User Profiles and Discovery Data

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| PROFILE-001 | P0 | As a user, I want to create a profile with name, nationality, location, languages, profession, interests, and photo, so that others can understand who I am. | User can save all required fields and upload a profile photo. | Ready |
| PROFILE-002 | P0 | As a user, I want to edit my profile, so that my information remains current. | User can update editable profile fields and changes are reflected across the app. | Ready |
| PROFILE-003 | P1 | As a user, I want to view another user's profile, so that I can decide whether to connect or chat. | Public profile view shows allowed fields and respects privacy settings. | Needs Detail |
| PROFILE-004 | P1 | As a user, I want to manage profile privacy, so that I can control what others see. | User can set visibility for selected profile fields. | Needs Detail |

### Epic 3: Location Management

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| LOC-001 | P0 | As a Super Admin, I want to manage countries, so that INHOD can operate in selected markets. | Admin can create, edit, activate, deactivate, and list countries. | Ready |
| LOC-002 | P0 | As a Super Admin, I want to manage states or provinces, so that users can select accurate regional locations. | Admin can create, edit, activate, deactivate, and list states under countries. | Ready |
| LOC-003 | P0 | As a Super Admin, I want to manage cities, so that communities and events can be localized. | Admin can create, edit, activate, deactivate, and list cities under states. | Ready |
| LOC-004 | P0 | As a user, I want to select my current country, state, and city, so that I can discover relevant communities and events. | Active locations appear in onboarding and profile forms. | Ready |

### Epic 4: Community Creation and Management

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| COMM-001 | P0 | As a user, I want to create a community, so that I can bring people together around a shared identity or interest. | User can enter community details, upload banner, choose category/location/privacy, and submit. | Ready |
| COMM-002 | P0 | As a community creator, I want to automatically become founder and moderator, so that I can manage the community I created. | Creator is inserted into community moderators and members with founder role. | Ready |
| COMM-003 | P0 | As a user, I want to browse communities by country, city, category, and search keyword, so that I can find relevant communities. | Search and filters return paginated community results. | Ready |
| COMM-004 | P0 | As a user, I want to view a community profile, so that I can decide whether to join. | Community page shows banner, name, description, category, rules, join fee, member count, location, and privacy status. | Ready |
| COMM-005 | P0 | As a moderator, I want to edit community details, so that I can keep information accurate. | Moderator can update allowed fields and changes are audited. | Ready |
| COMM-006 | P1 | As a Super Admin, I want to approve or reject newly created communities, so that I can control platform quality. | Admin can review pending communities and set status. | Needs Detail |
| COMM-007 | P1 | As a moderator, I want to add or remove moderators, so that trusted users can help manage the community. | Founder or authorized moderator can manage moderator list. | Ready |
| COMM-008 | P1 | As a moderator, I want to remove or ban members, so that I can protect the community. | Removed or banned members lose community access and ban record is stored. | Ready |

### Epic 5: Community Joining, Payments, and Rejoin Policy

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| PAY-001 | P0 | As a user, I want to see the community join fee in my local currency, so that I understand the cost before paying. | Price is calculated from base USD fee, exchange rate, and configured country currency. | Ready |
| PAY-002 | P0 | As a user, I want to pay the join fee, so that I can become a community member. | Successful payment creates membership and payment records. | Ready |
| PAY-003 | P0 | As the platform, I want to split revenue between platform and founder, so that earnings are allocated correctly. | Successful paid join creates wallet transaction for founder share and records platform share. | Ready |
| PAY-004 | P0 | As the platform, I want payment webhook handling to be idempotent, so that duplicate gateway events do not duplicate memberships or wallet credits. | Repeated webhook with same payment reference does not create duplicate records. | Ready |
| PAY-005 | P0 | As a Super Admin, I want to configure revenue split, so that the platform can adjust monetization rules. | Admin can set active split percentages with validation that total is 100%. | Ready |
| PAY-006 | P1 | As a Super Admin, I want to configure rejoin policy, so that returning members are charged correctly. | Policy supports pay every time, free rejoin within X days, lifetime access, and moderator-controlled. | Ready |
| PAY-007 | P1 | As a user, I want to rejoin a community according to the active policy, so that I am not overcharged. | System checks historical membership and applies policy before payment. | Ready |

### Epic 6: Social Feed and Engagement

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| FEED-001 | P0 | As a user, I want to create text and image posts, so that I can share updates with communities. | User can create valid posts and upload images where permitted. | Ready |
| FEED-002 | P0 | As a user, I want to view a community feed, so that I can follow discussions in communities I joined. | Feed shows paginated posts for active members only. | Ready |
| FEED-003 | P0 | As a user, I want to like and comment on posts, so that I can participate in discussions. | User can like/unlike and add/delete own comments. | Ready |
| FEED-004 | P0 | As a user, I want to report posts, so that unsafe content can be reviewed. | Report creates moderation record and notifies relevant admin/moderator queue. | Ready |
| FEED-005 | P1 | As a user, I want to view city and country feeds, so that I can discover local updates. | City/country feeds return authorized public posts. | Needs Detail |
| FEED-006 | P1 | As a moderator, I want to approve posts before publishing, so that I can moderate community quality. | Communities can enable post approval and moderators can approve/reject pending posts. | Ready |
| FEED-007 | P1 | As a user, I want to save posts, so that I can revisit useful information. | User can save/unsave posts and view saved posts list. | Ready |

### Epic 7: Events and Meetups

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| EVENT-001 | P0 | As a moderator, I want to create a community event, so that members can meet locally. | Moderator can enter title, description, date/time, location, capacity, type, and banner. | Ready |
| EVENT-002 | P0 | As a user, I want to browse events, so that I can find relevant meetups. | User can view event list filtered by community, city, country, type, and date. | Ready |
| EVENT-003 | P0 | As a user, I want to RSVP to an event, so that I can reserve a spot. | RSVP succeeds only when capacity is available and user is eligible. | Ready |
| EVENT-004 | P0 | As a user, I want to cancel my RSVP, so that I can free capacity if I cannot attend. | RSVP status updates and capacity count changes. | Ready |
| EVENT-005 | P1 | As a user, I want event reminders, so that I do not miss meetups I joined. | Scheduled reminder notification is sent before event time. | Ready |
| EVENT-006 | P2 | As a moderator, I want to sell tickets for events, so that communities can monetize meetups. | Paid ticket checkout, attendee status, and event revenue are supported. | Needs Detail |

### Epic 8: Chat and Realtime Communication

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| CHAT-001 | P0 | As a user, I want to send one-to-one messages, so that I can connect privately. | Authorized users can create or open a direct chat and send messages. | Ready |
| CHAT-002 | P0 | As a community member, I want to use community group chat, so that I can talk with other members. | Only active members can connect to community chat room. | Ready |
| CHAT-003 | P1 | As an event attendee, I want to join event chat, so that I can coordinate with attendees. | Event chat access is granted to eligible attendees. | Ready |
| CHAT-004 | P0 | As a user, I want read receipts, so that I know when messages are seen. | Message read state is tracked per participant. | Ready |
| CHAT-005 | P0 | As a user, I want to report or block chat users, so that I can protect myself from abuse. | Blocked user cannot message blocker and report is stored. | Ready |
| CHAT-006 | P1 | As a user, I want to send media in chat, so that I can share images or files. | Uploaded media is stored and message references secure media URL. | Ready |

### Epic 9: Notifications

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| NOTIF-001 | P0 | As a user, I want push notifications for important activity, so that I stay informed. | FCM sends notifications for configured activity types. | Ready |
| NOTIF-002 | P0 | As a user, I want in-app notification history, so that I can review past activity. | Notifications are stored and listed with read/unread state. | Ready |
| NOTIF-003 | P1 | As a user, I want notification preferences, so that I can control what I receive. | User can enable/disable major notification categories. | Needs Detail |

### Epic 10: Safety, Reports, and Moderation

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| SAFE-001 | P0 | As a user, I want to report abusive users, posts, comments, communities, and events, so that the platform remains safe. | User can submit report with reason and optional details. | Ready |
| SAFE-002 | P0 | As a Super Admin, I want a reports queue, so that I can review abuse reports. | Reports can be filtered by type, status, country, and severity. | Ready |
| SAFE-003 | P0 | As a Super Admin, I want to suspend or block users, so that I can stop abusive behavior. | Suspended/blocked users lose access according to status rules. | Ready |
| SAFE-004 | P1 | As a moderator, I want to remove posts in my community, so that I can enforce rules. | Moderator can remove community posts and action is audited. | Ready |
| SAFE-005 | P1 | As a Super Admin, I want to review moderation actions, so that I can audit community governance. | Admin can view moderation log by community and moderator. | Ready |

### Epic 11: Moderator Wallet and Payouts

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| WALLET-001 | P0 | As a moderator, I want to view my community earnings, so that I understand my revenue. | Dashboard shows total earnings, pending balance, available balance, and withdrawals. | Ready |
| WALLET-002 | P0 | As a moderator, I want to view transaction history, so that I can audit my earnings. | Wallet transactions list source community, payment, amount, currency, status, and date. | Ready |
| WALLET-003 | P1 | As a moderator, I want to request a payout, so that I can withdraw available earnings. | Moderator can submit payout request when balance meets threshold. | Ready |
| WALLET-004 | P1 | As a Super Admin, I want to approve or reject payout requests, so that payouts are controlled. | Admin decision updates payout status and wallet ledger. | Ready |
| WALLET-005 | P2 | As a moderator, I want to manage payout methods, so that I can receive money through my preferred channel. | Bank, PayPal, Stripe, Wise, UPI, or other method data can be stored securely. | Needs Detail |

### Epic 12: Super Admin Dashboard

| ID | Priority | Story | Acceptance Criteria | Status |
| --- | --- | --- | --- | --- |
| ADMIN-001 | P0 | As a Super Admin, I want to log in securely, so that only authorized operators can access the dashboard. | Admin login uses protected authentication and role validation. | Ready |
| ADMIN-002 | P0 | As a Super Admin, I want to view users, so that I can manage accounts. | User table supports search, filtering, pagination, and status actions. | Ready |
| ADMIN-003 | P0 | As a Super Admin, I want to view communities, so that I can manage community quality. | Community table supports status, category, country, city, and moderator filters. | Ready |
| ADMIN-004 | P0 | As a Super Admin, I want to configure pricing and revenue split, so that monetization rules are controlled. | Admin can update base fee, country currency, exchange rates, and split settings. | Ready |
| ADMIN-005 | P0 | As a Super Admin, I want to view payments and wallet activity, so that revenue can be audited. | Payment and wallet lists are searchable and filterable. | Ready |
| ADMIN-006 | P0 | As a Super Admin, I want an analytics dashboard, so that I can monitor platform health. | Dashboard shows active users, revenue, community growth, country stats, and top moderators. | Ready |

## 4. Development Backlog by Phase

### Phase 0: Foundation

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Define repository structure for mobile, admin, backend, and shared docs. | P0 | Engineering | Monorepo or separate repos decision required. |
| Configure backend Node.js + Express.js project. | P0 | Backend | Include TypeScript recommendation. |
| Configure MySQL schema migration tool. | P0 | Backend | Use Prisma, Sequelize, TypeORM, or Knex. |
| Configure Flutter mobile app project. | P0 | Mobile | Android and iOS targets. |
| Configure React admin dashboard. | P0 | Web | React or Next.js decision required. |
| Create environment configuration strategy. | P0 | DevOps | Separate local, staging, production. |
| Set up linting, formatting, and CI checks. | P0 | Engineering | Backend, mobile, admin. |

### Phase 1: Authentication, Profiles, and Locations

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Firebase OTP integration in mobile app. | P0 | Mobile/Backend | Backend verifies Firebase ID token. |
| User profile API and mobile onboarding screens. | P0 | Mobile/Backend | Required fields enforced. |
| Admin location CRUD. | P0 | Admin/Backend | Countries, states, cities. |
| Location selector APIs. | P0 | Backend | Active-only lists for mobile. |
| FCM device token registration. | P0 | Mobile/Backend | Needed before notification work. |

### Phase 2: Communities

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Community data model and APIs. | P0 | Backend | Category, location, privacy, rules, banner. |
| Community creation mobile flow. | P0 | Mobile | Creator becomes founder. |
| Community discovery and search. | P0 | Mobile/Backend | Keyword and filter support. |
| Community profile screen. | P0 | Mobile | Join CTA and member count. |
| Moderator community edit tools. | P0 | Mobile/Backend | Role checks required. |
| Admin community management. | P0 | Admin/Backend | Status, suspension, verification. |

### Phase 3: Payments, Membership, Wallet

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Pricing configuration APIs. | P0 | Backend/Admin | Base fee, currency, split. |
| Exchange rate ingestion or manual admin rates. | P0 | Backend/Admin | Live provider selection needed. |
| Payment gateway integration. | P0 | Backend/Mobile | Gateway decision required. |
| Payment webhook verification. | P0 | Backend | Idempotency required. |
| Community membership creation after payment. | P0 | Backend | Handles approval-required communities. |
| Wallet ledger and moderator revenue view. | P0 | Backend/Mobile | Immutable transaction records. |
| Payout request workflow. | P1 | Backend/Admin/Mobile | Can be manual payout in MVP. |

### Phase 4: Feed, Events, Notifications

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Post creation APIs and mobile screens. | P0 | Backend/Mobile | Text and image first. |
| Community feed pagination. | P0 | Backend/Mobile | Authorization required. |
| Likes and comments. | P0 | Backend/Mobile | Include soft-delete support. |
| Report post/comment/user. | P0 | Backend/Mobile/Admin | Moderation queue. |
| Event creation and RSVP. | P0 | Backend/Mobile | Community events first. |
| Push notification dispatch service. | P0 | Backend | FCM integration. |
| In-app notifications list. | P0 | Backend/Mobile | Read/unread state. |

### Phase 5: Chat and Realtime

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Socket.io authentication middleware. | P0 | Backend | Verify user token. |
| One-to-one chat model and APIs. | P0 | Backend/Mobile | Conversation creation. |
| Community chat rooms. | P0 | Backend/Mobile | Membership authorization. |
| Message persistence. | P0 | Backend | MySQL storage with pagination. |
| Read receipts. | P0 | Backend/Mobile | Participant-level state. |
| Chat push notifications. | P1 | Backend/Mobile | Respect block list. |
| Event chat. | P1 | Backend/Mobile | Eligibility policy required. |

### Phase 6: Admin, Analytics, Hardening

| Item | Priority | Owner Area | Notes |
| --- | --- | --- | --- |
| Admin reports queue. | P0 | Admin/Backend | Status workflow. |
| Admin user suspension and blocking. | P0 | Admin/Backend | Enforced by backend. |
| Payments and wallets admin screens. | P0 | Admin/Backend | Audit views. |
| Basic analytics aggregation. | P0 | Backend/Admin | Active users, revenue, communities. |
| Audit logging. | P1 | Backend/Admin | Admin and moderator actions. |
| Rate limiting and abuse prevention. | P1 | Backend | Auth, posting, chat, reporting. |
| Production observability. | P1 | DevOps | Logs, metrics, alerts. |

## 5. Future Backlog

| Item | Priority | Notes |
| --- | --- | --- |
| Subscription communities. | P2 | Recurring membership billing. |
| Paid event tickets. | P2 | Event-specific checkout and revenue split. |
| Featured communities. | P2 | Paid placement in discovery. |
| Community boosts. | P2 | Promotional ranking product. |
| Verified badges. | P2 | Identity or community trust feature. |
| Business promotion. | P2 | Local immigrant business listings. |
| Ads system. | P3 | Requires ad policy and moderation. |
| Advanced recommendations. | P2 | Based on nationality, city, interests, profession, activity. |
| AI spam detection. | P3 | Add after moderation data exists. |
| Multi-language support. | P3 | UI and content translation. |
| Public web community pages. | P3 | SEO and sharing. |

## 6. MVP Acceptance Checklist

- Users can register and log in with Firebase OTP.
- Users can complete and edit profiles.
- Super Admin can manage countries, states, and cities.
- Users can create and discover communities.
- Community creators become founders and moderators.
- Users can pay to join communities.
- Successful payments create membership and wallet records.
- Revenue split is recorded accurately.
- Moderators can manage members, posts, events, and settings.
- Users can post, like, comment, report, and save content.
- Users can create or join events with RSVP capacity limits.
- Users can use one-to-one and community chat.
- Push and in-app notifications work for key events.
- Super Admin can manage users, communities, reports, pricing, payments, wallets, payouts, and analytics.
- Basic security, role checks, rate limits, and audit logs are in place.

