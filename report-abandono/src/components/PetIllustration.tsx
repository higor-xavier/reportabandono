import mainImage from "@/assets/main.png"

export function PetIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <img 
        src={mainImage} 
        alt="Ilustração de pets" 
        className="w-full h-full max-w-2xl max-h-2xl object-contain"
      />
    </div>
  )
}

