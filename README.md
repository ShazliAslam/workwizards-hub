# WeActive9 Manager

Build a full-stack field engineer expense, shift tracking, and payroll web application for "WeActive9" with a clean, modern corporate UI.

Key Requirements:

1. User Roles & Authentication UI:

- Create two view modes: "Engineer Dashboard" and "CEO/Admin Dashboard".

- Mock Auth: Engineer login (views only their own personal data) vs. Admin login (views all 30-35 engineers' aggregated data).

2. Engineer Dashboard (Mobile-friendly):

- Daily Shift Log Form: Date, Site Location, Shift Type (Day/Night), Total Hours.

- Expense Entry Form: Fuel/Petrol costs, Meal allowances, Credit Card expenditures, and a File/Receipt Upload dropzone.

- Individual Summary Cards: Total logged hours this week, total claimed expenses, and personal downloadable PDF receipt preview.

3. Admin / CEO Dashboard:

- Global KPI Cards: Total Weekly/Monthly Expenses across all 30-35 engineers, Active Shifts today, Fuel Costs breakdown, and Credit Card Balances.

- Comprehensive Data Table: Filterable by Engineer Name, Site Location, Date Range, and Status (Pending/Approved).

- Payroll Module: Automated payroll calculator table based on hours worked + approved reimbursements with a "Generate Payroll PDF" button.

4. UI Style & Design System:

- Professional corporate color palette (Deep Navy Blue, Slate Gray, Clean White, and Accent Emerald/Cyan).

- Use Lucide React icons, Tailwind CSS, shadcn UI components, and Recharts for expense analytics.

- Make the interface ultra-responsive for mobile devices (engineers on site) and desktop (Admins).

Include dummy data for 30 engineers to demonstrate the filtering and role-based views clearly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://workwizards-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ddc5e44b-ffa6-4d6a-b16a-3f9b101e7c58).

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
