# App Flows and View Map

## Mobile Primary Navigation (Bottom Tray)
The mobile app uses a fixed bottom tray (always visible).  
From left to right:

1. Training
2. Program
3. Chat
4. Account

Route mapping:

- `Training` -> `/training`
- `Program` -> `/training/program`
- `Chat` -> `/training/chat`
- `Account` -> `/training/settings`

## Desktop Sidebar Mapping
Desktop navigation is grouped in the left sidebar as:

- `Training` section
- `Program` section
- `Chat` section (recent chats)

`User settings` is not a standalone sidebar section. It is accessed from the expandable user menu at the top of the sidebar.

## 1) Training View (Actionable)
Purpose: This is the user's operational, day-to-day screen.

The view includes:

- A lightweight dashboard at the top with suggestions, nudges, and notifications.
- A time-ordered list of upcoming sessions.
- Session cards/rows that are directly clickable to start execution (for example, today's planned workout).

Primary user intent in this view:

- "What should I do now?"
- "What is next?"
- "Start today's session."

## 2) Program View (Admin/Setup)
Purpose: This is the planning and configuration area where users build and maintain their program.

Program is represented by a hub page at `/training/program`, which links to:

- Session Builder (`/training/sessions`)
- Exercise Library (`/training/exercises`)
- Profile (`/training/profile`)

Primary user intent in this view:

- Create and organize sessions.
- Manage exercise definitions and metadata.
- Maintain issues, qualities, and training priorities.
- Configure program structure rather than execute a live session.

## 3) Chat View (Coach AI)
Purpose: Conversational interface with a coach AI (ChatGPT-like experience).

Capabilities:

- User can ask questions and get coaching guidance.
- AI can take actions on the user's behalf across app surfaces (with appropriate product constraints/permissions).

Primary user intent in this view:

- Get guidance quickly.
- Delegate multi-step edits/actions through natural language.

## 4) Account View
Purpose: User settings and account management.

Route: `/training/settings`

Primary user intent in this view:

- Manage identity and app preferences.
