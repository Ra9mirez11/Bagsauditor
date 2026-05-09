# 🛡️ Bags Auditor Agent

An AI-powered security sentinel for the **Bags ecosystem** on Solana. This agent uses **Claude 3.5 Sonnet** to perform deep-dive security audits, analyze creator fee distributions, and provide real-time risk assessments for Bags creator tokens.

![Bags Auditor UI](https://raw.githubusercontent.com/Ra9mirez11/Bagsauditor/main/public/demo.png) *(Note: Add your screenshot here)*

## 🚀 Features

- **AI Security Audit**: Real-time analysis of token contracts and social dynamics via Claude AI.
- **Bags API Integration**: Direct data fetching from the Bags REST API and TypeScript SDK.
- **Fee Visualization**: Monitor the 1% creator fee and lifetime revenue metrics.
- **Premium Design**: Built with React, Tailwind CSS, and Framer Motion for a stunning "Glassmorphism" experience.
- **Autonomous Ready**: Architectural foundation for deploying autonomous trading and management agents.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Claude 3.5 Sonnet (Anthropic SDK)
- **Blockchain**: @bagsfm/bags-sdk + @solana/web3.js

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ra9mirez11/Bagsauditor.git
   cd Bagsauditor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file (for Vercel deployment, set these in the dashboard):
   ```env
   ANTHROPIC_API_KEY=your_claude_key
   BAGS_API_KEY=your_bags_key
   SOLANA_RPC_URL=your_rpc_url
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

## 🏆 Hackathon Submission

This project was built for **The Bags Hackathon** (DoraHacks) to showcase the intersection of AI Agents, Social Finance, and Solana Security.

---
Built with ❤️ by [Bohumel] & Antigravity AI
