"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Loader2,
  Clock,
  Bell,
  X,
  AlertTriangle,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Interface pour les informations utilisateur
interface UserInfo {
  id: string
  nom: string
  email: string
  role: string
  etudiant?: {
    id: string
    matricule?: string | null
    niveauId: string
  }
  enseignant?: {
    id: string
    poste?: string | null
  }
}

enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Erreur lors du parsing des informations utilisateur:", e)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header moderne */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo et titre */}
            <motion.div
              className="flex items-center space-x-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <CalendarCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  EDT Pro
                </h1>
                <p className="text-sm text-gray-600 -mt-1">Tableau de bord</p>
              </div>
            </motion.div>

            {/* Section centrale - Informations utiles */}
            {/* Section centrale améliorée */}
            <div className="hidden lg:flex flex-1 max-w-3xl mx-12 justify-center">
              <div className="flex items-center space-x-6">
                {/* Carte de statut en temps réel */}
                <motion.div
                  className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 rounded-2xl border border-blue-200/50 shadow-lg backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date().toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-gray-600 -mt-1">
                        {new Date().toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {user.role === Role.ETUDIANT ? "5" : user.role === Role.ENSEIGNANT ? "8" : "23"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {user.role === Role.ETUDIANT
                          ? "Cours cette semaine"
                          : user.role === Role.ENSEIGNANT
                            ? "Séances à venir"
                            : "Utilisateurs actifs"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        14:30
                      </p>
                      <p className="text-xs text-gray-600">Prochain cours</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Section utilisateur */}
            <div className="flex items-center space-x-6">
              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 relative cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </motion.button>

              {/* Profil utilisateur */}
              {/* Profil utilisateur amélioré */}
              <motion.div
                className="flex items-center space-x-3 bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-2xl p-3 pr-5 cursor-pointer hover:from-gray-100/80 hover:to-blue-100/80 transition-all duration-300 shadow-lg backdrop-blur-sm border border-gray-200/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-200 ring-offset-2 shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nom}`} alt={user.nom} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-lg">
                      {user.nom.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-gray-900 flex items-center">
                    {user.nom}
                    {user.role === Role.ADMIN && <Settings className="h-4 w-4 ml-2 text-purple-600" />}
                    {user.role === Role.ENSEIGNANT && <BookOpen className="h-4 w-4 ml-2 text-emerald-600" />}
                    {user.role === Role.ETUDIANT && <GraduationCap className="h-4 w-4 ml-2 text-blue-600" />}
                  </p>
                  <p className="text-sm text-gray-600">{user.role.toLowerCase()}</p>
                </div>
              </motion.div>

              {/* Bouton de déconnexion */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-2 p-3 pr-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:block">Déconnexion</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Contenu principal */}
      <main className="flex-grow p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Message de bienvenue */}
        <motion.div className="text-center mb-12" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" variants={itemVariants}>
            Bienvenue, {user.nom} ! 👋
          </motion.h1>
          <motion.p className="text-xl text-gray-600 max-w-2xl mx-auto" variants={itemVariants}>
            Gérez efficacement votre emploi du temps et accédez à tous vos outils en un clic.
          </motion.p>
        </motion.div>

        {/* Grille des cartes */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Carte Emploi du temps */}
          <motion.div variants={itemVariants}>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                    <CalendarCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                    Mon Emploi du Temps
                  </CardTitle>
                </div>
                <CardDescription>Visualisez et gérez vos séances de cours en temps réel.</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-700 mb-6">Accédez rapidement à votre planning personnalisé et optimisé.</p>
                <Link href="/emploi-du-temps">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                    Voir l'emploi du temps
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Carte Profil */}
          <motion.div variants={itemVariants}>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                    Mon Profil
                  </CardTitle>
                </div>
                <CardDescription>Mettez à jour vos informations personnelles et préférences.</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-700 mb-6">Gérez votre profil, sécurité et paramètres de notification.</p>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                  >
                    Gérer le profil
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cartes conditionnelles selon le rôle */}
          {user.role === "ADMIN" && (
            <motion.div variants={itemVariants}>
              <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                      <LayoutDashboard className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-green-600 group-hover:text-green-700 transition-colors duration-300">
                      Panneau Admin
                    </CardTitle>
                  </div>
                  <CardDescription>Accédez aux outils d'administration avancés.</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-700 mb-6">
                    Gérez les utilisateurs, salles, matières et tous les paramètres système.
                  </p>
                  <Link href="/admin-panel/utilisateurs">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                      Aller au panneau
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {user.role === "ENSEIGNANT" && (
            <motion.div variants={itemVariants}>
              <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-300">
                      <Settings className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                      Mes Matières
                    </CardTitle>
                  </div>
                  <CardDescription>Gérez vos cours et matières enseignées.</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-700 mb-6">Visualisez et organisez toutes vos matières d'enseignement.</p>
                  <Link href="/teacher/courses">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                    >
                      Voir mes matières
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {user.role === "ETUDIANT" && (
            <motion.div variants={itemVariants}>
              <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                      Mes Résultats
                    </CardTitle>
                  </div>
                  <CardDescription>Consultez vos notes et performances académiques.</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-700 mb-6">Accédez à vos bulletins et suivez votre progression.</p>
                  <Link href="/student/results">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                    >
                      Voir mes résultats
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer moderne */}
      {/* Footer moderne et personnalisé */}
      <motion.footer
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16 mt-16 overflow-hidden"
      >
        {/* Éléments décoratifs animés */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 bg-blue-500/10 rounded-full -top-48 -left-48"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute w-64 h-64 bg-purple-500/10 rounded-full -bottom-32 -right-32"
            animate={{
              scale: [1, 0.8, 1],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Grille de points décorative */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=0 0 40 40 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=%23ffffff fillOpacity=0.03%3E%3Ccircle cx=20 cy=20 r=1/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Section Logo et Description */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <CalendarCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    EDT Pro
                  </h3>
                  <p className="text-gray-400 text-sm">Gestion d'emploi du temps</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Simplifiez la gestion de vos emplois du temps avec notre plateforme moderne et intuitive. Conçue pour
                les établissements d'enseignement qui veulent optimiser leur organisation.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Service actif</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Connecté en tant que {user.role.toLowerCase()}</span>
                </div>
              </div>
            </motion.div>

            {/* Section Liens Rapides */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <ChevronRight className="h-5 w-5 mr-2 text-blue-400" />
                Accès Rapide
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/emploi-du-temps"
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group cursor-pointer"
                  >
                    <CalendarCheck className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Mon Emploi du Temps
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-200 flex items-center group cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Mon Profil
                  </Link>
                </li>
                {user.role === Role.ADMIN && (
                  <li>
                    <Link
                      href="/admin/users"
                      className="text-gray-300 hover:text-green-400 transition-colors duration-200 flex items-center group cursor-pointer"
                    >
                      <Settings className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Administration
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Section Statistiques */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-2 text-purple-400" />
                Votre Activité
              </h4>
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">Dernière connexion</span>
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-white font-semibold">
                    {new Date().toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">Sessions cette semaine</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-white font-semibold">12 connexions</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Séparateur avec animation */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 1 }}
          />

          {/* Section Copyright et Liens */}
          <motion.div
            className="flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} EDT Pro. Tous droits réservés.</p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
                >
                  Confidentialité
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
                >
                  Conditions
                </Link>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
                >
                  Support
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm">Propulsé par</span>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Next.js & React</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.footer>

      {/* Modal de confirmation de déconnexion */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la déconnexion</h3>
                <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir vous déconnecter de votre session ?</p>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
