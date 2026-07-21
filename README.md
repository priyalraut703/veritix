# VeriTix

Fraud-proof, wallet-less event ticketing for India — built on Stellar/Soroban.

## Status
Frontend scaffold + design system in place. Smart contracts, wallet-less
onboarding, and backend are being built next (see project roadmap in the
Level 4 submission).

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:5173

## Stack
- React + TypeScript + Vite
- Tailwind CSS (design tokens in tailwind.config.js)
- react-router-dom for routing
- Soroban (Rust) smart contracts — see /contracts (coming next step)

## Project structure
```
src/
  components/   Shared UI: TicketStub, Navbar, ActivityTicker
  pages/        Route-level screens
  lib/          API calls, Stellar SDK helpers (coming next step)
contracts/       Soroban smart contract (coming next step)
```
