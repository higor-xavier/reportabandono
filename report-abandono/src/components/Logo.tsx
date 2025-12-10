import logoImage from "@/assets/logo.png"

export function Logo() {
  return (
    <img 
      src={logoImage} 
      alt="Logo" 
      className="w-30 h-30 object-contain"
    />
  )
}

