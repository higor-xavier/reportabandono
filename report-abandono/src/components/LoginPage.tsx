import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Logo } from "./Logo"
import { PetIllustration } from "./PetIllustration"

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 flex items-center justify-center gap-4 flex-wrap" style={{ backgroundColor: '#A4CEBD' }}>
        <Logo />
        <h1 className="text-gray-700 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-center opacity-75">Gerenciador de Denúncias</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Section - Illustration */}
        <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-12 min-h-[300px] lg:min-h-0">
          <PetIllustration />
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 md:p-12">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">Entrar</h2>
            
            <form className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail:
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full bg-gray-100 border-gray-300"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha:
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="**********"
                  className="w-full bg-gray-100 border-gray-300"
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full text-white font-semibold py-2 h-11 hover:opacity-90"
                style={{ backgroundColor: '#85A191' }}
              >
                LOGAR
              </Button>

              {/* Secondary Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                >
                  Registrar-se
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                >
                  Esqueceu a senha?
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

