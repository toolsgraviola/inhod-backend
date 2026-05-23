# INHOD Product Requirements Document

Version: 1.0
Date: 2026-05-21
Status: Draft for review

## 1. Executive Summary

INHOD is a mobile-first immigrant community and meetup platform for people living outside their home country. The product helps users discover, join, and create local communities based on nationality, profession, interests, language, location, and culture.

The platform combines community discovery, social posting, meetups, realtime chat, paid community membership, moderation, and revenue sharing for community founders. Users access the platform through a Flutter mobile application. Platform operators manage users, communities, reports, pricing, locations, revenue, and payouts through a React web admin dashboard.

## 2. Product Vision

INHOD will become a global immigrant network where people abroad can quickly find trusted communities, local support, meetups, professional contacts, and cultural connections.

Long-term, the product can expand into an expat marketplace, paid event ecosystem, business promotion platform, and premium subscription community network.

## 3. Product Goals

### 3.1 Primary Goals

- Build global immigrant communities across countries, states, and cities.
- Help users connect with people from their home country or shared culture.
- Enable local meetups, networking, and professional discovery.
- Allow users to create and moderate their own communities.
- Support paid community joining with revenue sharing.
- Provide scalable administration for multi-country operations.
- Create recurring revenue through joining fees and future premium products.

### 3.2 Success Metrics

- Registered users by country, city, nationality, and profession.
- Monthly active users and daily active users.
- Community creation rate.
- Community join conversion rate.
- Paid community revenue.
- Moderator earnings and payout activity.
- Post, comment, chat, and event engagement.
- Report resolution time.
- User retention by cohort.

## 4. Business Model

Users pay a fee when joining eligible communities.

Default pricing model:

- Base join fee: USD 1.
- Currency conversion: dynamically converted into local currency.
- Revenue split: 50% platform and 50% community founder or moderator wallet.

Future monetization may include:

- Verified badges.
- Featured communities.
- Community boosts.
- Premium events.
- Business promotion.
- Advertising.
- Subscription communities.

## 5. Target Users

### 5.1 Mobile App User

A registered user living abroad who wants to find communities, make friends, attend events, post updates, chat, or create their own community.

### 5.2 Community Founder / Moderator

A user who creates or manages a community. Community creators automatically become founders and moderators. Moderators manage posts, members, settings, events, and community earnings.

### 5.3 Super Admin

The platform owner or operations team member responsible for managing users, countries, cities, communities, pricing, reports, payouts, and analytics.

## 6. Scope

### 6.1 In Scope

- Mobile OTP authentication using Firebase.
- User profile creation and editing.
- Country, state, city, nationality, language, profession, and interest capture.
- Community discovery and search.
- User-created communities.
- Public and private communities.
- Paid community joining.
- Dynamic local currency pricing.
- Revenue split between platform and community founder.
- Community moderation tools.
- Social feed with posts, comments, likes, shares, saves, and reports.
- Meetup and event creation.
- RSVP and event capacity.
- One-to-one chat, community chat, and event chat.
- Push notifications through Firebase Cloud Messaging.
- Moderator wallet, earnings, and payout requests.
- Super Admin web dashboard.
- Reports, abuse handling, suspension, and blocking.
- Basic analytics.
- Media storage for profile photos, community banners, posts, and event images.

### 6.2 Out of Scope for MVP

- Paid event ticketing.
- Subscription communities.
- Advertising system.
- Business marketplace.
- Crypto payouts.
- AI-based spam detection.
- Full KYC for moderators.
- In-app calls or live streaming.
- Multi-language translation.
- Public web community pages.

## 7. User Roles and Permissions

### 7.1 Super Admin

Super Admins can:

- Manage platform settings.
- Create, edit, and deactivate countries, states, and cities.
- View, edit, suspend, block, or delete users.
- View and moderate communities.
- Approve, suspend, verify, or remove communities.
- Configure pricing, currencies, exchange rates, and revenue split.
- Review reported users, posts, comments, communities, and events.
- Suspend accounts and restrict abusive users.
- View payments, wallet balances, transactions, and payout requests.
- Approve or reject payout requests.
- View analytics by country, city, community, and revenue.

### 7.2 User

Users can:

- Register and log in using mobile OTP.
- Create and edit a profile.
- Discover communities, users, events, cities, and categories.
- Join communities after payment or approval.
- Create communities.
- Create posts in permitted feeds.
- Like, comment, share, save, and report posts.
- Join and RSVP to events.
- Chat one-to-one and in group contexts.
- Report abuse and block users.

### 7.3 Community Founder / Moderator

Moderators can:

- Edit community details and settings.
- Approve or reject join requests when approval is required.
- Approve or reject posts when post approval is enabled.
- Remove or ban community members.
- Pin announcements.
- Create and manage community events.
- Add or remove additional moderators.
- View revenue, earnings, paid members, and community growth.
- Request payouts.

## 8. Core Product Requirements

### 8.1 Authentication and Registration

Users must register and log in with a mobile number using Firebase OTP authentication.

Registration fields:

- Full name.
- Mobile number.
- Nationality.
- Current country.
- State or province.
- City.
- Languages.
- Profession.
- Interests.
- Profile photo.

Requirements:

- Mobile number must be unique.
- Firebase UID must be linked to the application user record.
- Users must complete required profile fields before accessing core features.
- Suspended or blocked users must not be able to use the platform.

### 8.2 User Profiles

Profiles must support:

- Basic identity details.
- Profile photo.
- Location.
- Nationality.
- Languages.
- Profession.
- Interests.
- Joined communities.
- Created communities.
- Events attended or RSVP'd.
- Privacy controls for visible profile details.

### 8.3 Location Management

The platform must support multi-country operation through normalized location data:

- Countries.
- States or provinces.
- Cities.
- Country currency configuration.

Locations are managed by Super Admins and used for community discovery, pricing, feed filtering, user profiles, analytics, and events.

### 8.4 Community System

Users can create communities. The creator automatically becomes founder and moderator.

Community examples:

- Indians in UAE.
- Telugu People in Dubai.
- Telugu Restaurant Owners Dubai.
- Indian Students USA.
- Tamil IT Employees Canada.

Community fields:

- Community name.
- Description.
- Category.
- Country.
- State.
- City.
- Banner image.
- Rules.
- Public or private visibility.
- Join fee.
- Rejoin policy.
- Approval required.

Community categories:

- General.
- Business.
- Students.
- IT Professionals.
- Restaurants.
- Jobs.
- Real Estate.
- Families.
- Events.
- Sports.
- Religious.
- Startups.

Requirements:

- Community names should be unique within the same city and category where practical.
- Communities may be public or private.
- Communities may require moderator approval before access.
- Super Admins may approve, suspend, verify, or remove communities.
- Founders may add additional moderators.

### 8.5 Community Joining and Payments

Join flow:

1. User selects a community.
2. System checks membership status and rejoin policy.
3. System calculates local currency price from the configured base fee and exchange rate.
4. Payment gateway session is initiated.
5. Payment is completed and verified.
6. User is added to the community or moved into pending approval.
7. Revenue is split between platform and community founder wallet.
8. Payment and wallet transactions are recorded.

Business rules:

- Default base fee is USD 1.
- Default revenue split is 50% platform and 50% community founder.
- Super Admin can configure revenue split.
- Failed payments must not add users to paid communities.
- Payment processing must be idempotent.
- Refund handling must be auditable.

### 8.6 Rejoin Policy

Super Admin can configure platform-level and community-level rejoin behavior.

Supported policies:

- Pay every time.
- Free rejoin within X days.
- Lifetime access.
- Moderator-controlled.

Requirements:

- The system must record membership history.
- Rejoin eligibility must be calculated before payment.
- Policy changes must not corrupt historical payment records.

### 8.7 Social Feed

Feed types:

- Global feed.
- Community feed.
- City feed.
- Country feed.

Post features:

- Text posts.
- Image posts.
- Video posts.
- Likes.
- Comments.
- Shares.
- Saves.
- Reports.

Requirements:

- Community feeds must respect membership and community privacy.
- Reported content must be visible to moderators and Super Admins.
- Moderators may approve, reject, remove, or pin posts depending on community settings.

### 8.8 Meetup and Events

Event features:

- Create event.
- Event banner.
- Event title and description.
- Date and time.
- Google Maps location.
- RSVP.
- Event capacity.
- Event chat.
- Future ticket pricing support.

Event types:

- Networking.
- Sports.
- Business.
- Startup meetups.
- Family gatherings.
- Cultural events.

Requirements:

- Events can be associated with a community.
- Event creators and moderators can manage details and attendees.
- Users can RSVP until capacity is reached.
- Event reminders are sent through push notifications.

### 8.9 Chat

Chat types:

- One-to-one chat.
- Community group chat.
- Event chat.

Chat features:

- Text messages.
- Media sharing.
- Read receipts.
- Push notifications.
- Block and report user.

Technology:

- Socket.io for realtime communication.
- Firebase may be used for notification delivery and mobile authentication.

Requirements:

- Users must only access chats they are authorized to join.
- Community chat access requires active community membership.
- Event chat access requires RSVP or community membership depending on event settings.

### 8.10 Notifications

Push notifications must support:

- New post.
- Event reminder.
- Join approval.
- Community updates.
- Moderator actions.
- Payment updates.
- Chat messages.

Notifications must be stored in the backend for in-app notification history and delivered through Firebase Cloud Messaging for mobile push.

### 8.11 Moderator Tools

Community management:

- Edit community.
- Remove members.
- Ban users.
- Approve posts.
- Pin announcements.
- Create events.
- Add or remove moderators.
- Manage community settings.

Revenue dashboard:

- Total earnings.
- Pending payouts.
- Community growth.
- Paid members.
- Transaction history.

### 8.12 Wallet and Revenue

Moderator wallet tracks:

- Community join earnings.
- Pending balance.
- Available balance.
- Withdrawals.
- Transaction history.

Payout methods for future support:

- Bank transfer.
- PayPal.
- Stripe.
- Wise.
- UPI.
- Crypto.

MVP requirements:

- Record wallet credits from paid joins.
- Allow moderators to request payouts.
- Allow Super Admins to approve or reject payout requests.
- Keep all wallet movements auditable.

### 8.13 Super Admin Dashboard

Admin dashboard modules:

- User management.
- Community management.
- Location management.
- Currency and pricing.
- Reports and abuse.
- Payments, wallets, and payouts.
- Analytics.
- Platform settings.

User management:

- View users.
- Edit users.
- Suspend users.
- Block users.
- Delete users.
- View reports.

Community management:

- Approve communities.
- Suspend communities.
- Remove communities.
- Verify communities.

Location management:

- Country CRUD.
- State CRUD.
- City CRUD.

Currency and pricing:

- Country currency.
- Exchange rates.
- Join pricing.
- Revenue split.

Analytics:

- Active users.
- Revenue.
- Community growth.
- Country statistics.
- Top moderators.

### 8.14 Search and Discovery

Users can search:

- Communities.
- Users.
- Events.
- Cities.
- Categories.

Smart suggestions are based on:

- Nationality.
- Current country.
- Current city.
- Profession.
- Interests.
- Joined communities.

### 8.15 Safety and Moderation

Safety features:

- Report users.
- Report posts.
- Report comments.
- Report communities.
- Report events.
- Block users.
- Community moderation.
- Spam management.

Admin controls:

- Suspend accounts.
- Block accounts.
- Remove communities.
- Hide or remove posts.
- Restrict abusive devices or IPs where legally and technically appropriate.

## 9. Non-Functional Requirements

### 9.1 Performance

- Mobile app should load primary screens in under 3 seconds on typical network conditions.
- Feed and search APIs must support pagination.
- Chat messages should be delivered in near realtime.
- Admin dashboard list views must support filtering, sorting, and pagination.

### 9.2 Scalability

- Backend services must support horizontal scaling.
- Realtime infrastructure must support multiple Socket.io instances.
- Media files must be stored outside the application server.
- Database schema must support country-level and city-level growth.

### 9.3 Security

- Firebase ID tokens must be verified on backend requests.
- Role-based access control is required for users, moderators, and Super Admins.
- Payment webhooks must be verified.
- Sensitive configuration must be stored in environment variables or secret management.
- User-generated content must be validated and sanitized.

### 9.4 Reliability

- Payment and wallet flows must be idempotent.
- Critical events must be logged.
- Failed notifications should be retryable.
- Database backups must be scheduled.

### 9.5 Compliance and Privacy

- Collect only required personal data.
- Support account suspension and deletion flows.
- Store audit trails for moderation and payments.
- Prepare for regional privacy requirements as the product expands.

## 10. MVP Release Scope

Recommended MVP:

- Firebase OTP login.
- User profile onboarding.
- Location data management.
- Community creation and discovery.
- Paid community join flow.
- Basic revenue split ledger.
- Community membership.
- Community feed with text and image posts.
- Likes and comments.
- Basic reporting.
- Moderator community management.
- Event creation and RSVP.
- One-to-one and community chat.
- FCM push notifications.
- Admin dashboard for users, communities, locations, pricing, reports, payments, and analytics.

## 11. Future Releases

Post-MVP features:

- Subscription communities.
- Paid event ticketing.
- Featured and boosted communities.
- Verified badges.
- Business promotion.
- Ads platform.
- Advanced spam detection.
- Public web community pages.
- Marketplace listings.
- Advanced recommendation engine.
- Multi-language content support.

## 12. Assumptions and Decisions

- The final database choice is MySQL.
- PostgreSQL was mentioned in an earlier stack option, but the final architecture specifies MySQL.
- Firebase is used for OTP authentication and FCM push notifications.
- Socket.io is used for realtime chat and live notification events.
- Payment gateway selection is pending. Stripe is a strong default for global cards where available, but local gateways may be required by country.
- AWS S3 or Cloudflare R2 will be used for media storage.
- Super Admin dashboard is web-only.
- User and moderator features are mobile-first in Flutter.

## 13. Key Risks

- Payment gateway availability and payout support may vary by country.
- Exchange rate accuracy and pricing rules need operational controls.
- Wallet and payout flows require strong auditing.
- Community moderation workload may increase quickly as communities scale.
- Chat and feed systems need abuse prevention from the first release.
- Multi-country compliance requirements may differ by operating region.

## 14. Open Questions

- Which payment gateway should be used for the first launch country?
- Which country or region is the first launch market?
- Should community creation require admin approval before publishing?
- Should private community content be hidden from non-members entirely?
- Should event chat be limited to RSVP'd users only?
- What minimum payout threshold should moderators have?
- Will admin users have multiple roles or only a single Super Admin role for MVP?

