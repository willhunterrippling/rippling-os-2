<!-- Source: [MASTER] Rippling Industry Values - [MASTER] All Industries (1).csv -->
<!-- Added: 2026-02-06 -->
<!-- Type: Definition -->

# Rippling Industry Persona Mapping

**Data file:** `rippling_industry_persona_mapping.csv`

## Overview

Master mapping of LinkedIn industry values to Rippling persona segments with color-coded priority tiers. Used to determine outreach eligibility and prioritization across all sales segments and geographies.

## Columns

| Column | Description |
|--------|-------------|
| `Industry Normalized` | The normalized industry name (granular level) |
| `Industry Segment` | Rolled-up industry segment grouping |
| `Industry Vertical` | Top-level industry vertical |
| `STRAT_RYOG` | Strategic segment color tier |
| `ENT_RYOG` | Enterprise segment color tier |
| `MM_RYOG` | Mid-Market segment color tier |
| `SMB_RYOG` | SMB segment color tier |
| `INTL_GLOBAL_ONLY_RYOG` | International (global) segment color tier |
| `UKI_RYOG` | UK & Ireland segment color tier |
| `AU_RYOG` | Australia segment color tier |
| `FR_RYOG` | France segment color tier |
| `DE_RYOG` | Germany segment color tier |
| `IT_ONLY_RYOG` | Italy segment color tier |
| `SPEND_ONLY_RYOG` | Spend-only segment color tier |
| `Linkedin_ITO` | LinkedIn ITO mapping |
| `CA_RYOG` | Canada segment color tier |
| `CA_QC_RYOG` | Canada Quebec segment color tier |

## Color Tier Meanings

| Color | Meaning |
|-------|---------|
| **Green** | Highest priority / fully eligible |
| **Yellow** | Eligible with standard priority |
| **Orange** | Lower priority / limited eligibility |
| **Red** | Low priority / generally not targeted |
| **Excluded** | Completely excluded from outreach |

## Usage

This mapping is referenced by MO (Mechanized Outreach) suppression logic to determine which industries are eligible for outreach in each segment. Industries marked "Excluded" or "Red" in a given segment column are typically suppressed from outreach campaigns for that segment.
