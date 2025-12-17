import { Logo } from "./Logo"

export function Header() {
  return (
    <header 
      className="w-full px-6 flex items-center justify-center gap-4 flex-wrap" 
      style={{ backgroundColor: '#A4CEBD' }}
    >
      <Logo />
      <h1 className="text-gray-700 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-center opacity-75">
        ReportAbandono
      </h1>
    </header>
  )
}

