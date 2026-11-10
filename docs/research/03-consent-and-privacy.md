# Consent and privacy messaging

## Approach

The product owner decided that playing implies willingness to answer anonymous questions. There is no consent gate. To keep this honest:

- what is collected is stated **before** play (title screen) and on every research step;
- every step is skippable with no penalty;
- records carry `consentStatus: "implied_by_play"`, so the basis is explicit in the data;
- nothing personal is collected, so no PDPA-personal data is held. Have the team's DPO confirm this position before the event.

## On-screen copy (as implemented)

| Where | Copy |
|---|---|
| Title screen | "Between missions, wiTTy asks a few quick questions about your real work. Your answers are anonymous: no names, emails or free text. Skip any step." |
| Every research step (footer) | "Anonymous. No names, emails or free text. Your answers don't affect your score." |
| Research frame chip | "REAL MISSION · NOT SCORED" |
| Interest screen | "Only if it's relevant to your work. Playing the game doesn't sign you up for anything." · "Registration happens on FormSG. This game never asks for your name or email." |
| Results and Detective | "Game scenarios and translations are fictional and illustrative." / "Illustrative example: not an official translation" |

## Booth signage text (for the tabletop card / staff)

> **Your privacy:** no names, emails or free text are collected. Answers are anonymous and reported only in aggregate, for the SG Translate 2.0 team to understand translation needs. Skip any question.

## What is never collected

Names, emails, phone numbers, NRIC/FIN, agency names, IP addresses (only used in memory for rate limiting), user agents, device fingerprints, location, free text, screenshots, or camera and microphone input.

## Retention

Records are purged automatically after `RETENTION_DAYS` (default 90). An admin can delete everything earlier from the dashboard by typing `DELETE ALL DATA`.
