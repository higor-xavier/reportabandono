import { cn } from "@/lib/utils"

interface ToggleGroupProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function ToggleGroup({ value, onValueChange, options, className }: ToggleGroupProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              isSelected
                ? "text-gray-800"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            )}
            style={{
              backgroundColor: isSelected ? "#A4CEBD" : undefined,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

