# 🍅 Ketchup (Frontend): The Centralized Planning Portal

Ketchup is the user-facing interface of the autonomous social coordination platform. It replaces scattered group chat threads with a centralized dashboard where friend groups can vote on AI-generated plans, view personalized carpooling logistics, and provide feedback on their experiences.

---

## 🏗 Essential Project Information

### User Experience Philosophy
* **The "Vibe Spectrum" UI**: Displays five distinct event options (Anchor, Pivot, Reach, Chill, Wildcard) to solve decision paralysis.
* **Segmented Logistics**: Provides a "Driver View" for car owners and a "Passenger View" for those being picked up.
* **Retrospective Feedback**: A dedicated post-event interface to collect "Loved/Liked/Disliked" ratings that fuel the preference learning loop.

### Target Metrics
| Category | Metric | Target |
| :--- | :--- | :--- |
| **Product** | 24h Engagement Rate (Voting) | > 80%  |
| **Product** | User Satisfaction ("Loved/Liked") | > 70%  |
| **System** | Deployment Automation | 100% (No manual intervention)  |
| **Business** | Active Planning Time | < 5 Minutes/Month  |

---

## 📁 Repository Structure

The frontend adheres to modern, modular web standards to ensure maintainability and high-performance rendering.

* **`src/app/`**: Application routing and server-side logic.
* **`src/components/`**: Modular UI elements like the "Voting Card" and "Consensus Progress Bar".
* **`src/hooks/`**: Specialized logic for handling Google OAuth 2.0 authentication and state.
* **`infra/gcp/`**: Configuration for **Cloud Run**, **Artifact Registry**, and CI/CD pipelines.

---

## ⚙️ Installation Instructions

To replicate the portal in a fresh environment, follow these steps:

### 1. Prerequisites
* **Node.js (v18+)** and **npm/yarn** installed.
* **Docker** for containerized local testing.
* **GCP Project** with the **Maps JavaScript API** enabled.
* **Client ID**: A valid Google OAuth 2.0 Client ID for portal authentication.

### 2. Environment Setup
```bash
# Clone the repository
git clone [https://github.com/codeabiswas/ketchup-frontend.git](https://github.com/codeabiswas/ketchup-frontend.git)
cd ketchup-frontend

# Install dependencies
npm install

# Set up local environment variables
cp .env.example .env.local
# Add your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and OAUTH_CLIENT_ID
