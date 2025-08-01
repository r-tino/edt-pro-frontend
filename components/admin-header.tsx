"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  LogOut,
  Bell,
  LayoutDashboard,
  Building,
  Users,
  GraduationCap,
  Shield,
  BookOpen,
  Building2,
  Grid3X3,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminHeaderProps {
  user: {
    id: string
    nom: string
    email: string
    role: string
  }
  onLogout: () => void
  currentPage?: string
}

export function AdminHeader({ user, onLogout, currentPage }: AdminHeaderProps) {
  const router = useRouter()

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Accueil",
      icon: LayoutDashboard,
      color: "indigo",
      active: currentPage === "dashboard",
    },
    {
      href: "/departements",
      label: "Départements",
      icon: Building,
      color: "blue",
      active: currentPage === "departements",
    },
    {
      href: "/niveaux",
      label: "Niveaux",
      icon: GraduationCap,
      color: "purple",
      active: currentPage === "niveaux",
    },
    {
      href: "/matieres",
      label: "Matières",
      icon: BookOpen,
      color: "emerald",
      active: currentPage === "matieres",
    },
    {
      href: "/salles",
      label: "Salles",
      icon: Building2,
      color: "orange",
      active: currentPage === "salles",
    },
    {
      href: "/admin/seances",
      label: "Séances",
      icon: CalendarCheck,
      color: "yellow",
      active: currentPage === "seances",
    },
    { href: "/emploi-du-temps", 
      label: "EDT", 
      icon: Grid3X3, 
      color: "blue", 
      active: currentPage === "emploi-du-temps" },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: Users,
      color: "green",
      active: currentPage === "users",
    },
  ]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40"
    >
      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-24">
          {/* Logo et titre avec plus d'espace */}
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
              <p className="text-sm text-gray-600 -mt-1">Administration</p>
            </div>
          </motion.div>

          {/* Navigation centrale avec plus d'espace */}
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

          {/* Section utilisateur avec plus d'espace */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 relative cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button> */}

            {/* Profil utilisateur */}
            <div className="flex items-center space-x-4 bg-gray-50/80 rounded-xl p-4 pr-6 hover:bg-gray-100/80 transition-all duration-200 cursor-pointer">
              <Avatar className="h-10 w-10 ring-2 ring-blue-200 ring-offset-2">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nom}`} alt={user.nom} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {user.nom.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="font-semibold text-gray-900 flex items-center">
                  {user.nom}
                  <Shield className="h-4 w-4 ml-2 text-purple-600" />
                </p>
                <p className="text-sm text-gray-600">Administrateur</p>
              </div>
            </div>

            {/* Bouton de déconnexion */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center space-x-3 p-4 pr-5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:block">Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
