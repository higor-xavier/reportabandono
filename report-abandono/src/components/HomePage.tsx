import { Link } from "react-router-dom"
import { FileText, Camera, MapPin, Share2 } from "lucide-react"
import { NavigationHeader } from "./NavigationHeader"
import { PetIllustration } from "./PetIllustration"
import { Button } from "./ui/button"

const howItWorksSteps = [
  {
    icon: FileText,
    label: "Registre-se",
  },
  {
    icon: Camera,
    label: "Fotografe",
  },
  {
    icon: MapPin,
    label: "Acompanhe",
  },
  {
    icon: Share2,
    label: "Compartilhe",
  },
]

export function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavigationHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 gap-4 sm:gap-5 lg:gap-6 xl:gap-8 w-full max-w-7xl mx-auto shrink-0">
          {/* Left Column - Text and CTA */}
          <div className="flex-1 flex flex-col items-center lg:items-start justify-center gap-3 sm:gap-4 lg:gap-5 w-full lg:w-auto text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
              Denuncie o abandono de animais
            </h1>
            <Button
              variant="primary"
              size="lg"
              className="text-sm sm:text-base px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 h-auto"
              asChild
            >
              <Link to="/register">Denunciar</Link>
            </Button>
          </div>

          {/* Right Column - Illustration */}
          <div className="flex-1 flex items-center justify-center w-full lg:w-auto max-w-xs sm:max-w-sm lg:max-w-md">
            <PetIllustration />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-gray-50 w-full flex-1 py-4 sm:py-5 md:py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 mt-auto">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 text-center mb-3 sm:mb-4 md:mb-5">
              Como funciona
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-4xl lg:max-w-5xl mx-auto">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-2 sm:p-3 md:p-4 flex flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 hover:shadow-lg transition-shadow"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" />
                    </div>
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700 text-center">
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

