// src/app/(app)/dashboard/page.tsx
'use client'; // Ce composant est un Client Component.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarCheck,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Loader2,
  Clock,
  Bell,
  X,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Shield,
  MapPin,
  Hash,
  Briefcase,
  Users,
  Building,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Énumération des rôles (doit correspondre au backend)
enum Role {
  ADMIN = "ADMIN",
  ETUDIANT = "ETUDIANT",
  ENSEIGNANT = "ENSEIGNANT",
}

// Interface pour les informations utilisateur étendues
interface UserInfo {
  id: string
  nom: string
  email: string
  role: Role // Utilise l'énumération pour le rôle
  etudiant?: {
    id: string
    matricule?: string | null
    niveau?: {
      // Inclut les détails du niveau
      id: string
      nom: string
      departement: {
        id: string
        nom: string
      }
    }
  }
  enseignant?: {
    id: string
    poste?: string | null
    matieres?: Array<{
      enseignantId: string
      matiereId: string
      matiere: {
        id: string
        nom: string
        niveauId: string
        niveau: {
          id: string
          nom: string
          departement: {
            id: string
            nom: string
          }
        }
      }
    }>
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser: UserInfo = JSON.parse(storedUser)
        setUser(parsedUser)
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

  // Fonction pour obtenir les couleurs selon le rôle
  const getRoleColors = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return {
          primary: "from-purple-600 to-indigo-600",
          secondary: "from-purple-50 to-indigo-50",
          text: "text-purple-800",
          border: "border-purple-200",
          icon: "text-purple-600",
          badge: "bg-purple-100 text-purple-800",
        }
      case Role.ETUDIANT:
        return {
          primary: "from-blue-600 to-cyan-600",
          secondary: "from-blue-50 to-cyan-50",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: "text-blue-600",
          badge: "bg-blue-100 text-blue-800",
        }
      case Role.ENSEIGNANT:
        return {
          primary: "from-emerald-600 to-teal-600",
          secondary: "from-emerald-50 to-teal-50",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: "text-emerald-600",
          badge: "bg-emerald-100 text-emerald-800",
        }
      default:
        return {
          primary: "from-gray-600 to-gray-600",
          secondary: "from-gray-50 to-gray-50",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: "text-gray-600",
          badge: "bg-gray-100 text-gray-800",
        }
    }
  }

  // Fonction pour obtenir l'icône selon le rôle
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return Shield
      case Role.ETUDIANT:
        return GraduationCap
      case Role.ENSEIGNANT:
        return BookOpen
      default:
        return User
    }
  }

  // Composant pour les informations métier utilisateur - Version compacte
  const UserProfileSection = () => {
    if (!user) return null

    const colors = getRoleColors(user.role)
    const RoleIcon = getRoleIcon(user.role)

    return (
      <motion.div className="mb-8" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          {/* Version compacte horizontale */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
            {/* Header compact */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <motion.div
                  className={`p-3 bg-gradient-to-br ${colors.primary} rounded-xl shadow-md`}
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <RoleIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className={`text-xl font-bold ${colors.text}`}>
                    {user.role === Role.ADMIN && "Administrateur"}
                    {user.role === Role.ETUDIANT && "Étudiant"}
                    {user.role === Role.ENSEIGNANT && "Enseignant"}
                  </h3>
                  <p className="text-gray-600 text-sm">Profil utilisateur</p>
                </div>
              </div>
              <motion.div
                className={`px-4 py-2 ${colors.badge} rounded-full text-sm font-medium`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                Connecté
              </motion.div>
            </div>

            {/* Contenu spécifique selon le rôle - Version horizontale compacte */}
            {user.role === Role.ADMIN && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Shield, label: "Accès", value: "Complet", color: "purple" },
                  { icon: Users, label: "Gestion", value: "Globale", color: "indigo" },
                  { icon: Settings, label: "Contrôle", value: "Total", color: "blue" },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="text-center p-3 bg-gray-50/80 rounded-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <item.icon className={`h-5 w-5 text-${item.color}-600 mx-auto mb-2`} />
                    <p className="text-xs font-medium text-gray-700">{item.label}</p>
                    <p className={`text-sm font-bold text-${item.color}-600`}>{item.value}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {user.role === Role.ETUDIANT && (
              <div>
                {user.etudiant ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50/80 rounded-xl">
                      <Hash className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600">Matricule</p>
                        <p className="text-sm font-semibold text-blue-800">{user.etudiant.matricule || "Non défini"}</p>
                      </div>
                    </div>

                    {user.etudiant.niveau && (
                      <>
                        <div className="flex items-center space-x-3 p-3 bg-indigo-50/80 rounded-xl">
                          <GraduationCap className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Niveau</p>
                            <p className="text-sm font-semibold text-indigo-800">{user.etudiant.niveau.nom}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-emerald-50/80 rounded-xl">
                          <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Département</p>
                            <p className="text-sm font-semibold text-emerald-800">
                              {user.etudiant.niveau.departement.nom}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-orange-50/80 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Profil incomplet</p>
                      <p className="text-xs text-orange-600">Contactez l'administration</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user.role === Role.ENSEIGNANT && (
              <div>
                {user.enseignant ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-emerald-50/80 rounded-xl">
                        <Briefcase className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600">Poste</p>
                          <p className="text-sm font-semibold text-emerald-800">
                            {user.enseignant.poste || "Non défini"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-teal-50/80 rounded-xl">
                        <BookOpen className="h-5 w-5 text-teal-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600">Matières</p>
                          <p className="text-sm font-semibold text-teal-800">
                            {user.enseignant?.matieres?.length || 0} discipline(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {user.enseignant?.matieres && user.enseignant.matieres.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {user.enseignant.matieres.slice(0, 3).map((em, idx) => (
                          <motion.div
                            key={idx}
                            className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {em?.matiere?.nom || "Matière"}
                          </motion.div>
                        ))}
                        {user.enseignant.matieres.length > 3 && (
                          <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{user.enseignant.matieres.length - 3} autres
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-orange-50/80 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Profil incomplet</p>
                      <p className="text-xs text-orange-600">Contactez l'administration</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
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

  // --- COMPOSANTS POUR LES TABLEAUX DE BORD SPÉCIFIQUES AUX RÔLES (SIMPLIFIÉS) ---

  const AdminDashboardContent = () => (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <Settings className="h-7 w-7 mr-3 text-purple-600" /> Tableau de bord Administrateur
        </h2>
        <p className="text-lg text-gray-600">Gérez l'ensemble de la plateforme avec des outils puissants.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Panneau Admin - Gestion des Départements (Anciennement Paramètres Système) */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  Gestion des Départements
                </CardTitle>
              </div>
              <CardDescription>Ajoutez, modifiez ou supprimez les départements universitaires.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Gérez les structures organisationnelles de l'institution.</p>
              <Link href="/admin/departements">
                <Button
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les Départements
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* NOUVEAU Panneau Admin - Gestion des Niveaux */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                  Gestion des Niveaux
                </CardTitle>
              </div>
              <CardDescription>Définissez et organisez les niveaux d'études (L1, M2, etc.).</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Associez chaque niveau à un département spécifique.</p>
              <Link href="/admin/niveaux"> {/* Lien vers la nouvelle page */}
                <Button
                  variant="outline"
                  className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les Niveaux
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* NOUVEAU Panneau Admin - Gestion des Matières */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">
                  Gestion des Matières
                </CardTitle>
              </div>
              <CardDescription>Créez et organisez les matières par niveau d'études.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Définissez les disciplines enseignées dans chaque niveau.</p>
              <Link href="/admin/matieres">
                <Button
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les Matières
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* NOUVEAU Panneau Admin - Gestion des Salles */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                  Gestion des Salles
                </CardTitle>
              </div>
              <CardDescription>Créez et organisez les salles de cours et amphithéâtres.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Gérez les espaces d'enseignement et leur capacité.</p>
              <Link href="/admin/salles">
                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les Salles
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* NOUVELLE Carte Admin - Gestion des Séances */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors duration-300">
                  <CalendarCheck className="h-6 w-6 text-violet-600" />
                </div>
                <CardTitle className="text-violet-600 group-hover:text-violet-700 transition-colors duration-300">
                  Gestion des Séances
                </CardTitle>
              </div>
              <CardDescription>Créez, modifiez et consultez toutes les séances de cours.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Organisez les séances pour chaque niveau, matière, enseignant et salle.</p>
              <Link href="/admin/seances">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-700 hover:from-violet-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                  Accéder
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Panneau Admin - Gestion des Emplois du Temps */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-300">
                  <CalendarCheck className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                  Gestion des EDT
                </CardTitle>
              </div>
              <CardDescription>Créez et organisez les emplois du temps de toute l'institution.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">
                Supervisez et ajustez le planning général des cours et des ressources.
              </p>
              <Link href="/emploi-du-temps">
                <Button
                  variant="outline"
                  className="w-full border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les EDT
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Panneau Admin - Gestion des utilisateurs */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  Gestion des Utilisateurs
                </CardTitle>
              </div>
              <CardDescription>Ajoutez, modifiez ou supprimez des comptes étudiants et enseignants.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Contrôlez les accès et les informations de chaque utilisateur.</p>
              <Link href="/admin/users">
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                  Accéder
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  )

  const EtudiantDashboardContent = () => (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <GraduationCap className="h-7 w-7 mr-3 text-blue-600" /> Mon Espace Étudiant
        </h2>
        <p className="text-lg text-gray-600">Accédez rapidement à votre emploi du temps et à vos résultats.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Carte Emploi du temps Étudiant */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <CalendarCheck className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  Mon Emploi du Temps
                </CardTitle>
              </div>
              <CardDescription>Consultez votre planning de cours personnalisé.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Accédez à votre emploi du temps par jour, semaine ou mois.</p>
              <Link href="/emploi-du-temps">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                  Voir mon EDT
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Carte Résultats Étudiant */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors duration-300">
                  <BookOpen className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-pink-600 group-hover:text-pink-700 transition-colors duration-300">
                  Mes Résultats
                </CardTitle>
              </div>
              <CardDescription>Accédez à vos notes et performances académiques.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">
                Consultez vos bulletins de notes pour toutes les matières et sessions.
              </p>
              <Link href="/student/grades">
                <Button
                  variant="outline"
                  className="w-full border-2 border-pink-500 text-pink-600 hover:bg-pink-50 hover:border-pink-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Voir mes notes
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )

  const EnseignantDashboardContent = () => (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <BookOpen className="h-7 w-7 mr-3 text-emerald-600" /> Mon Espace Enseignant
        </h2>
        <p className="text-lg text-gray-600">Gérez vos cours, vos notes et communiquez avec vos étudiants.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Carte Gestion des Séances */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                  <CalendarCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">
                  Gestion des Séances
                </CardTitle>
              </div>
              <CardDescription>Créez, modifiez et annulez vos séances de cours.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">Organisez votre planning d'enseignement efficacement.</p>
              <Link href="/emploi-du-temps">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02] cursor-pointer">
                  Gérer les séances
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Carte Gestion des Notes */}
        <motion.div variants={itemVariants}>
          <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full overflow-hidden relative cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-300">
                  <BookOpen className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300">
                  Gestion des Notes
                </CardTitle>
              </div>
              <CardDescription>Saisissez et gérez les notes de vos étudiants.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-gray-700 mb-6">
                Enregistrez et consultez les performances de vos classes.
              </p>
              <Link href="/enseignant/grades">
                <Button
                  variant="outline"
                  className="w-full border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-600 shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] cursor-pointer bg-transparent"
                >
                  Gérer les notes
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
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

        {/* Section des informations utilisateur */}
        <UserProfileSection />

        {/* Rendu conditionnel des différents tableaux de bord basés sur le rôle */}
        {user.role === Role.ADMIN && <AdminDashboardContent />}
        {user.role === Role.ETUDIANT && <EtudiantDashboardContent />}
        {user.role === Role.ENSEIGNANT && <EnseignantDashboardContent />}
      </main>

      {/* Footer moderne */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900 text-white py-8 mt-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CalendarCheck className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-blue-400">EDT Pro</span>
          </div>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Votre Application d'Emploi du Temps. Tous droits réservés.
          </p>
        </div>
      </motion.footer>

      {/* Modal de confirmation de déconnexion */}
      {/* <AnimatePresence>
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
      </AnimatePresence> */}
    </div>
  )
}
