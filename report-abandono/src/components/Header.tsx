import { Logo } from "./Logo"

export function Header() {
  return (
    <header 
      className="w-full px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-4 flex-wrap py-2 sm:py-0" 
      style={{ backgroundColor: '#A4CEBD' }}
    >
      <Logo />
      <h1 className="text-gray-700 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extralight text-center opacity-75">
        ReportAbandono
      </h1>
    </header>
  )
}



