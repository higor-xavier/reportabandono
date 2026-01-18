import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useState, useMemo } from "react"
import { Logo } from "./Logo"
import { UserAvatar } from "./UserAvatar"
import { useAuth } from "@/contexts/AuthContext"

export function NavigationHeader() {
  const location = useLocation()
  const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Definir links de navegação baseados no tipo de usuário
  const navItems = useMemo(() => {
    const baseItems = [
      { path: "/home", label: "Início" },
      { path: "/rastreio", label: "Rastreio" },
      { path: "/registrardenuncia", label: "Realizar denúncia" },
    ]

    // Adicionar link específico baseado no tipo de usuário
    if (user?.tipoUsuario === "ADMIN") {
      baseItems.splice(1, 0, { path: "/gerenciamento-solicitacoes", label: "Gerenciamento" })
    } else if (user?.tipoUsuario === "ONG") {
      baseItems.splice(1, 0, { path: "/gerenciamento-denuncias", label: "Gerenciamento" })
    } else if (user?.tipoUsuario === "COMUM") {
      baseItems.splice(1, 0, { path: "/denuncias", label: "Denúncias" })
    }

    return baseItems
  }, [user?.tipoUsuario])

  return (
    <header
      className="relative w-full py-2"
      style={{ backgroundColor: "#A4CEBD" }}
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-10 xl:px-12 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        <Link
          to="/home"
          className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Logo />
          <h1 className="text-gray-700 text-lg sm:text-xl md:text-2xl lg:text-3xl font-extralight opacity-75 whitespace-nowrap">
            ReportAbandono
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-5 flex-shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm lg:text-base font-normal transition-colors ${
                  isActive
                    ? "text-gray-900 font-semibold"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:text-gray-900 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Desktop Avatar */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <UserAvatar />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
          <nav className="flex flex-col px-4 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-normal py-3 px-2 transition-colors border-b border-gray-100 last:border-b-0 ${
                    isActive
                      ? "text-gray-900 font-semibold"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="py-3 px-2 border-t border-gray-200 mt-2">
              <UserAvatar />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

