# Course Module

## Overview
This module handles course creation, lifecycle management (Draft, Published, Archived), external resource link management, and association with Telegram bots.

## Key Entities
- **Course**: The main entity containing metadata like name, description, and price.
- **CourseExternalLink**: Resources (links) delivered to users upon purchase.
- **BotCourse**: Join table linking courses to specific Telegram bots.

## Procedures (tRPC)
- `list`: Get all courses in a workspace.
- `getById`: Get full course details including links and bot associations.
- `create`: Create a new course in Draft status.
- `update`: Update course metadata.
- `publish`: Set status to PUBLISHED (makes it visible in bots).
- `archive`: Set status to ARCHIVED (hides from bots, preserves access for existing buyers).
- `delete`: Soft-delete the course.
- `addLink`/`removeLink`/`reorderLinks`: Manage external content links.
- `linkToBot`/`unlinkFromBot`: Manage which bots sell this course.

## Usage
Creators manage courses in the Dashboard. End-users interact with published courses via the configured Telegram bots.
