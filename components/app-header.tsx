"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Grid3X3,
  Shield,
  Building,
  Users,
  Building2,
  AlertTriangle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AppHeaderProps {
  user: {
    id: string
    nom: string
    email: string
    role: string
  }
  onLogout: () => void
  currentPage?: string
}

/**
 * Composant de l'en-tête de l'application.
 * Affiche la navigation et les informations de l'utilisateur.
 * @param {AppHeaderProps} props Les propriétés du composant.
 */
export function AppHeader({ user, onLogout, currentPage }: AppHeaderProps) {
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Navigation selon le rôle de l'utilisateur
  let navigationItems: any[] = []
  if (user.role === "ADMIN") {
    navigationItems = [
      {
        href: "/dashboard",
        label: "Accueil",
        icon: LayoutDashboard,
        color: "indigo",
        active: currentPage === "dashboard",
      },
      {
        href: "/admin/departements",
        label: "Départements",
        icon: Building,
        color: "blue",
        active: currentPage === "departements",
      },
      {
        href: "/admin/niveaux",
        label: "Niveaux",
        icon: GraduationCap,
        color: "purple",
        active: currentPage === "niveaux",
      },
      {
        href: "/admin/matieres",
        label: "Matières",
        icon: BookOpen,
        color: "emerald",
        active: currentPage === "matieres",
      },
      { href: "/admin/salles", label: "Salles", icon: Building2, color: "orange", active: currentPage === "salles" },
      {
        href: "/admin/seances",
        label: "Séances",
        icon: CalendarCheck,
        color: "yellow",
        active: currentPage === "seances",
      },
      {
        href: "/emploi-du-temps",
        label: "EDT",
        icon: Grid3X3,
        color: "blue",
        active: currentPage === "emploi-du-temps",
      },
      { href: "/admin/users", label: "Utilisateurs", icon: Users, color: "green", active: currentPage === "users" },
    ]
  } else if (user.role === "ETUDIANT") {
    navigationItems = [
      {
        href: "/dashboard",
        label: "Accueil",
        icon: LayoutDashboard,
        color: "blue",
        active: currentPage === "dashboard",
      },
      {
        href: "/emploi-du-temps",
        label: "Mon EDT",
        icon: CalendarCheck,
        color: "blue",
        active: currentPage === "emploi-du-temps",
      },
      {
        href: "/etudiant/grades",
        label: "Mes Résultats",
        icon: BookOpen,
        color: "purple",
        active: currentPage === "grades",
      },
    ]
  } else if (user.role === "ENSEIGNANT") {
    navigationItems = [
      {
        href: "/dashboard",
        label: "Accueil",
        icon: LayoutDashboard,
        color: "emerald",
        active: currentPage === "dashboard",
      },
      {
        href: "/emploi-du-temps",
        label: "Séances",
        icon: CalendarCheck,
        color: "emerald",
        active: currentPage === "emploi-du-temps",
      },
      { href: "/enseignant/grades", label: "Notes", icon: BookOpen, color: "yellow", active: currentPage === "Notes" },
    ]
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false)
    onLogout()
  }

  const handleCancelLogout = () => {
    setShowLogoutDialog(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40"
      >
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center h-24">
            {/* Logo et titre */}
            <motion.div
              className="flex items-center space-x-6 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => router.push("/dashboard")}
            >
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <CalendarCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  EDT Pro
                </h1>
                <p className="text-sm text-gray-600 -mt-1">
                  {user.role === "ADMIN"
                    ? "Administration"
                    : user.role === "ETUDIANT"
                      ? "Espace étudiant"
                      : "Espace enseignant"}
                </p>
              </div>
            </motion.div>

            {/* Navigation centrale */}
            <div className="hidden lg:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        item.active
                          ? `bg-${item.color}-100 text-${item.color}-700 shadow-md`
                          : `text-gray-600 hover:text-${item.color}-600 hover:bg-${item.color}-50`
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Section utilisateur */}
            <div className="flex items-center space-x-6">
              {/* Nouveau : Rendre la section utilisateur cliquable */}
              <Link href="/profile" passHref>
                <motion.div
                  className="flex items-center space-x-4 bg-gray-50/80 rounded-xl p-4 pr-6 hover:bg-gray-100/80 transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200 ring-offset-2">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nom}`} alt={user.nom} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                      {user.nom.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-900 flex items-center">
                      {user.nom}
                      {user.role === "ADMIN" && <Shield className="h-4 w-4 ml-2 text-purple-600" />}
                      {user.role === "ETUDIANT" && <GraduationCap className="h-4 w-4 ml-2 text-blue-600" />}
                      {user.role === "ENSEIGNANT" && <BookOpen className="h-4 w-4 ml-2 text-emerald-600" />}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.role === "ADMIN" ? "Administrateur" : user.role === "ETUDIANT" ? "Étudiant" : "Enseignant"}
                    </p>
                  </div>
                </motion.div>
              </Link>

              {/* Bouton de déconnexion */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoutClick}
                className="flex items-center space-x-3 p-4 pr-5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:block">Déconnexion</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Boîte de dialogue de confirmation de déconnexion */}
      {/* <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              Confirmer la déconnexion
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Attention</p>
              <p>Toutes les données non sauvegardées seront perdues.</p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelLogout}
              className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent cursor-pointer"
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  )
}
