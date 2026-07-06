SETUP GUIDE

Aurora Name AI Development Environment & Recovery Manual

Version: v1.0.1

Last Updated: 2026-06-27

⸻

Purpose

This document explains how to completely restore the Aurora Name AI development environment on a new computer.

It also records deployment procedures, troubleshooting experience, and development principles accumulated during the project.

⸻

System Requirements

Recommended Operating System

* Windows 11

Recommended Software

* Git
* Node.js (LTS)
* Cursor (Recommended) or VS Code
* Google Chrome / Microsoft Edge

⸻

Install Git

Download and install Git.

Verify installation

git --version

⸻

Install Node.js

Install the latest LTS version.

Verify

node -v
npm -v

⸻

Install Cloudflare Wrangler

npm install -g wrangler

Verify

wrangler --version

⸻

Clone the Repository

git clone https://github.com/chenmwy/Aurora_Name_AI.git

Enter the project folder

cd Aurora_Name_AI

⸻

Configure Git Identity

git config --global user.name "YourName"
git config --global user.email "your@email.com"

Verify

git config --list

⸻

Login to Cloudflare

wrangler login

A browser window will open.

Authorize your Cloudflare account.

⸻

Verify Cloudflare Resources

Pages

Aurora Name AI

Database

thenameai

Make sure both still exist before development.

⸻

Local Development

Run locally

wrangler pages dev .

⸻

Production Deployment

Stage changes

git add .

Commit

git commit -m "Your commit message"

Push

git push origin main

Cloudflare Pages automatically deploys the latest version after every successful push.

⸻

Project Structure

Aurora_Name_AI/

assets/

functions/

└── api/

project-history/

CHANGELOG.md

PROJECT_HISTORY.md

README.md

SETUP.md

index.html

styles.css

wrangler.jsonc

⸻

Documentation

README.md

Project introduction.

CHANGELOG.md

Version history.

PROJECT_HISTORY.md

Development milestones.

SETUP.md

Development environment and recovery manual.

⸻

Database

Cloudflare D1

Database Name

thenameai

Current Tables

* podcast_names

Current Data

* Keywords
* Generated Names
* Meaning
* Inspiration
* Score
* Memorability
* Brandability
* Professionalism
* Created Time

⸻

Database Backup

Always create a backup before changing database structure.

Export

wrangler d1 export thenameai --remote

Save SQL files inside

project-history/

Recommended naming

backup_YYYY-MM-DD.sql

Example

backup_2026-06-26.sql

⸻

Release Workflow

Every official release should follow this order.

1. Finish development
2. Test all features
3. Backup database
4. Update CHANGELOG.md
5. Update PROJECT_HISTORY.md
6. Update README.md (if needed)
7. Update SETUP.md (if needed)
8. Git Commit
9. Git Push
10. Verify Cloudflare deployment
11. Verify website
12. Create GitHub Release

⸻

Troubleshooting

Git Merge Conflict

Symptom

Automatic merge failed.

Cause

Different histories or conflicting files.

Solution

git pull origin main --allow-unrelated-histories

Resolve conflicts using Cursor Merge Editor.

Save files.

git add .
git commit

⸻

GitHub Push Failed

Symptom

Failed to connect to github.com port 443

Cause

Temporary network issue.

Solution

Verify GitHub is accessible.

Retry

git push origin main

No additional commit is required.

⸻

Duplicate Database Records

Symptom

Generating 10 names inserted 20 records.

Cause

Both frontend and backend saved the same data.

Solution

Remove frontend save request.

Only keep backend database insertion.

⸻

Cloudflare D1 Binding Error

Cause

Incorrect binding configuration.

Verify

binding

database_name

database_id

inside

wrangler.jsonc

⸻

README Not Displayed

Cause

README was not committed or pushed.

Solution

git add README.md
git commit -m "Add project README"
git push origin main

⸻

Git Identity Missing

Symptom

Author identity unknown

Solution

git config --global user.name "YourName"
git config --global user.email "your@email.com"

⸻

Line Ending Warning

Symptom

LF will be replaced by CRLF

Cause

Windows line ending conversion.

Status

Normal.

No action required.

⸻

Wrangler Login Expired

Symptom

Permission denied or authentication error.

Solution

wrangler login

Authenticate again.

⸻

Recovery Checklist

After reinstalling Windows

□ Install Git

□ Install Node.js

□ Install Wrangler

□ Install Cursor

□ Clone GitHub Repository

□ Configure Git Identity

□ Login to Cloudflare

□ Verify Cloudflare Pages

□ Verify D1 Database

□ Run Local Development

□ Test Website

□ Test Git Push

⸻

Development Principles

Aurora Name AI follows these principles.

1. Keep the main branch stable.
2. Every production release must have a GitHub Release.
3. Every version updates CHANGELOG.md.
4. Every milestone updates PROJECT_HISTORY.md.
5. Always backup the database before structural changes.
6. Fix root causes instead of temporary workarounds.
7. Record every solved problem in the Troubleshooting section.
8. Documentation is part of the product.

⸻

Project Milestones

v1.0.0

First Production Release

Completed

* Cloudflare Pages
* Cloudflare Functions
* Cloudflare D1
* GitHub Repository
* Automatic Deployment
* README
* CHANGELOG
* PROJECT_HISTORY
* Version Footer
* Database Backup

⸻

Future Improvements

v1.1.0

Generation History

v1.2.0

Favorites

v1.3.0

SEO Landing Pages

v1.4.0

Name Detail Pages

v2.0.0

User Accounts

Premium Features

API Access

⸻

End of Document

⸻

Copyright © 2026 Aurora Name AI

This document is maintained together with the project and should be updated whenever the development workflow changes.