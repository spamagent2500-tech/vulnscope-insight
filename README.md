# Scope Security Insights

Build a professional web-based cybersecurity vulnerability analysis tool called VulnScope.

The tool is intended for authorized security assessments, lab environments, and educational purposes only. It must not perform exploitation, credential attacks, brute forcing, malware deployment, persistence, or destructive actions.

1. Main Dashboard

Create a modern cybersecurity/SOC-style dashboard showing:

Total assets analyzed

Total vulnerabilities

Critical vulnerabilities

High vulnerabilities

Medium vulnerabilities

Low vulnerabilities

Vulnerabilities discovered recently

Risk score

Remediation progress

Use clear charts and visual indicators.

2. Asset Analysis

Allow the user to create and manage authorized assets.

Each asset should contain:

Asset name

IP address or hostname

Operating system

Asset type

Owner

Environment (Lab / Development / Production)

Date of last assessment

Include a clear checkbox/confirmation that the user has authorization to analyze the asset.

3. Vulnerability Input

Create a form where the user can enter or import vulnerability findings.

Support:

CVE ID

Vulnerability title

Description

Affected asset

Affected service/software

Installed version

CVSS score

Severity

Evidence

Discovery date

Automatically classify severity:

Critical

High

Medium

Low

Informational

4. CVE Information

When a CVE ID is entered, provide a structured area for CVE information.

Display:

CVE identifier

CVSS score

Severity

Description

Affected products

References

Remediation information

Do not invent CVE information. If external CVE data is unavailable, clearly tell the user that the information must be manually verified.

5. Risk Analysis

Calculate a risk score for each finding using factors such as:

CVSS severity

Asset importance

Exposure

Exploit availability

Business impact

Show a simple explanation of why a vulnerability received its risk rating.

6. Vulnerability Details Page

For every vulnerability provide:

Vulnerability description

Severity

CVSS score

Affected asset

Affected software

Evidence

Potential impact

Recommended remediation

Verification status

References

Do NOT provide weaponized exploitation instructions.

7. Remediation Management

Allow users to change vulnerability status:

Open

Investigating

Remediation in Progress

Resolved

Accepted Risk

False Positive

Allow remediation notes and due dates.

8. Search and Filtering

Add powerful filtering for:

Severity

CVE

Asset

Operating system

Status

CVSS score

Date discovered

Add global search.

9. Reports

Create a professional report-generation page.

Allow the user to generate a report containing:

Assessment summary

Scope

Assets analyzed

Vulnerability statistics

Critical/high findings

Detailed findings

Risk analysis

Recommended remediation

Remediation status

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/250aebc1-e471-5ce6-bd7b-cbf5873f3c67).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
