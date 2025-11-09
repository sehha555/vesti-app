# Style Monorepo

This project is a comprehensive fashion and styling application built on a modern web stack. It provides features like wardrobe management, daily outfit recommendations based on weather, and more.

## ✨ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) with **App Router**
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.io/) (PostgreSQL)
- **Image Management**: [Cloudinary](https://cloudinary.com/)
- **Background Removal**: [remove.bg](https://www.remove.bg/)
- **Weather Data**: [OpenWeatherMap](https://openweathermap.org/)
- **Styling**: (Not specified, assuming Tailwind CSS is used or planned)
- **Monorepo Tool**: Turborepo

---

## 🏛️ Architecture

This project is organized as a monorepo using Turborepo. The architecture is designed to be modular and scalable.

- **`apps/web`**: The main web application built with Next.js. It contains all the UI, pages, and API routes. It now exclusively uses the **App Router** model for both pages and APIs.

- **`services/`**: Contains all the backend business logic, decoupled from the web framework. This includes services for recommendations (`reco`), wardrobe management (`wardrobe`), and weather (`weather`).

- **`packages/`**: Shared code used across the monorepo.
  - **`types`**: Shared TypeScript type definitions (e.g., `WardrobeItem`, `Outfit`).
  - **`ui`**: (Placeholder) For shared React UI components.
  - **`prompts`**: (Placeholder) For prompts used in AI/LLM integrations.

- **`docs/`**: All project documentation, including architecture diagrams, API references, and migration plans.

- **`infra/`**: Infrastructure as Code (IaC) definitions, such as Docker, Kubernetes, or Terraform configurations.

---

## 📁 Project Structure

Here is a high-level overview of the most important directories:

```
.
├── apps/
│   └── web/
│       └── app/
│           ├── (pages)/
│           │   ├── basket/
│           │   ├── cart/
│           │   ├── daily/
│           │   └── gap-fill/
│           └── api/
│               ├── daily-outfits/
│               ├── outfits/
│               ├── reco/
│               └── wardrobe/
├── docs/
│   ├── backend-api-reference.md
│   ├── backend-services.md
│   └── migration-plan.md
├── packages/
│   ├── types/
│   └── ui/
├── services/
│   ├── reco/
│   ├── wardrobe/
│   └── weather/
└── tsconfig.json
```

---

## 🚀 Getting Started

### Environment Variables

The project requires several environment variables to function correctly. Copy the `.env.example` (if available) to `.env.local` and fill in the required keys.

#### OpenWeatherMap API Key

The weather service requires an API key from OpenWeatherMap.

1.  **Sign up** for a free account on [OpenWeatherMap](https://openweathermap.org/appid).
2.  **Find your API key** on the [API keys page](https://home.openweathermap.org/api_keys).
3.  **Copy the key** and paste it into your `.env.local` file as `WEATHER_API_KEY`.

```
WEATHER_API_KEY=your_api_key_here
```

You will also need keys for **Supabase**, **Cloudinary**, and **remove.bg**.
