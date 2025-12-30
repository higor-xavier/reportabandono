import { Link } from "react-router-dom"
import { Header } from "./Header"
import { PetIllustration } from "./PetIllustration"
import { Button } from "./ui/button"

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Section - Illustration */}
          <div className="flex-1 flex items-center justify-center w-full lg:w-auto max-w-md lg:max-w-lg">
            <PetIllustration />
          </div>

          {/* Right Section - Error Message */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-4 sm:gap-5 lg:gap-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-gray-700 opacity-75">
              Erro 404!
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-800">
              Página não encontrada.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-md">
              Esse endereço não existe no nosso sistema!
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-4 sm:mt-6 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto"
              asChild
            >
              <Link to="/home">Página inicial</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

