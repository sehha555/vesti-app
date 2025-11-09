// apps/web/app/page.tsx

import { WeatherSection } from './components/sections/WeatherSection'
import { QuickFunctionCards } from './components/sections/QuickFunctionCards'
import { DailyOutfitSection } from './components/sections/DailyOutfitSection'
import { PersonalizedSection } from './components/sections/PersonalizedSection'

export default function HomePage() {
  return (
    <div className="space-y-6 p-4">
      <WeatherSection />
      <QuickFunctionCards />
      <DailyOutfitSection />
      <PersonalizedSection />
    </div>
  )
}
