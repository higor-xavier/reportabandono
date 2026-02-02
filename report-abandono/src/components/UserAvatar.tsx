import { useState } from "react"
import { User, Lock, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { ProfileDialog } from "./ProfileDialog"

export function UserAvatar() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate("/")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label="Menu do usuário"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Editar informações do perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Lock className="mr-2 h-4 w-4" />
            <span>Trocar senha</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  )
}

