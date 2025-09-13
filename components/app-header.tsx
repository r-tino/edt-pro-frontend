"use client"

import { Button } from "@/components/ui/button"
import { CalendarCheck, LogOut } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface UserInfo {
  id: string
  nom: string
  email: string
  role: "ADMIN" | "ETUDIANT" | "ENSEIGNANT"
}

interface AppHeaderProps {
  user: UserInfo
  onLogout: () => void
  currentPage: string
}

export function AppHeader({ user, onLogout, currentPage }: AppHeaderProps) {
  const adminNavItems = [
    { href: "/admin/seances", label: "Séances", key: "seances" },
    { href: "/admin/users", label: "Utilisateurs", key: "users" },
    { href: "/admin/matieres", label: "Matières", key: "matieres" },
    { href: "/admin/salles", label: "Salles", key: "salles" },
    { href: "/admin/departements", label: "Départements", key: "departements" },
    { href: "/admin/niveaux", label: "Niveaux", key: "niveaux" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-xl">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EDT Pro
              </span>
            </Link>
          </motion.div>

          {user.role === "ADMIN" && (
            <nav className="hidden md:flex items-center space-x-1">
              {adminNavItems.map((item) => (
                <Link key={item.key} href={item.href}>
                  <Button
                    variant={currentPage === item.key ? "default" : "ghost"}
                    className="px-4 py-2 rounded-lg font-medium"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.nom.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.nom}</p>
                <p className="text-xs text-gray-600">{user.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
