// src/app/(app)/niveaux/page.tsx
'use client'; // Ce composant est un Client Component.

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  List,
  AlertTriangle,
  Info,
  Building,
  Hash,
  Shield,
  Star,
  CheckCircle,
  Search,
  Users,
  BookOpen, // Ajout pour les matières
  Clock,
  TrendingUp,    // Ajout pour les séances
} from "lucide-react"

// Composants Shadcn UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Importation de Sonner pour les notifications
import { Toaster, toast } from "sonner"

// Interfaces pour correspondre à la structure des données du backend
enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

interface Departement {
  id: string
  nom: string
}

interface Niveau {
  id: string
  nom: string
  departementId: string
  departement: Departement // Inclut le département lié
  _count?: { // AJOUTÉ : Les comptes des relations (doit venir du backend)
    etudiants: number;
    matieres: number;
    seances: number;
  }
}

interface UserInfo {
  id: string
  nom: string
  email: string
  role: Role
  etudiant?: {
    id: string
    matricule?: string | null
    niveauId?: string
  }
  enseignant?: {
    id: string
    poste?: string | null
  }
}

export default function NiveauxPage() {
  const router = useRouter()
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [filteredNiveaux, setFilteredNiveaux] = useState<Niveau[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [currentNiveau, setCurrentNiveau] = useState<Niveau | null>(null)
  const [newNiveauName, setNewNiveauName] = useState("")
  const [selectedDepartementId, setSelectedDepartementId] = useState<string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [niveauToDeleteId, setNiveauToDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animations variants sophistiquées
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        type: "spring" as const,
        stiffness: 120,
        damping: 20,
      },
    },
    hover: {
      scale: 1.02,
      y: -8,
      transition: {
        duration: 0.3,
        type: "spring" as const,
        stiffness: 300,
      },
    },
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotateX: -15,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.4,
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotateX: 15,
      transition: {
        duration: 0.3,
      },
    },
  }

  // Chargement initial de l'utilisateur
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        if (parsedUser.role !== Role.ADMIN) {
          setError("Accès refusé. Seuls les administrateurs peuvent gérer les niveaux.")
        }
      } catch (e) {
        console.error("Erreur lors du parsing des informations utilisateur:", e)
        localStorage.removeItem("user")
        localStorage.removeItem("accessToken")
        setUser(null)
        setError("Session invalide. Veuillez vous reconnecter.")
      }
    } else {
      setError("Non authentifié. Veuillez vous connecter.")
    }
  }, [])

  // Fonctions pour récupérer les départements et les niveaux
  const fetchDepartements = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/departements", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération des départements.")
      }
      const result = await response.json()
      setDepartements(result.data || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des départements:", err)
      toast.error(`Erreur chargement départements: ${err.message}`, { duration: 5000 })
    }
  }, [])

  const fetchNiveaux = useCallback(async () => {
    if (!user || user.role !== Role.ADMIN) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      setError("Token d'authentification manquant. Veuillez vous reconnecter.")
      setLoading(false)
      return
    }

    // Charger les départements d'abord car ils sont nécessaires pour les niveaux
    await fetchDepartements(accessToken)

    try {
      const response = await fetch("http://localhost:3000/api/niveaux", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération des niveaux.")
      }

      const result = await response.json()
      // Le backend doit retourner { data: Niveau[] } avec _count
      setNiveaux(result.data || [])
      setFilteredNiveaux(result.data || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des niveaux:", err)
      setError(err.message || "Impossible de charger les niveaux.")
    } finally {
      setLoading(false)
    }
  }, [user, fetchDepartements])

  // Déclencher le chargement initial des niveaux
  useEffect(() => {
    if (user && user.role === Role.ADMIN) {
      fetchNiveaux()
    }
  }, [user, fetchNiveaux])

  // Filtrage des niveaux
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNiveaux(niveaux)
    } else {
      const filtered = niveaux.filter(
        (niveau) =>
          niveau.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          niveau.departement?.nom.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredNiveaux(filtered)
    }
  }, [searchTerm, niveaux])

  const handleOpenAddModal = () => {
    setCurrentNiveau(null)
    setNewNiveauName("")
    setSelectedDepartementId("")
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (niveau: Niveau) => {
    setCurrentNiveau(niveau)
    setNewNiveauName(niveau.nom)
    setSelectedDepartementId(niveau.departementId)
    setIsFormModalOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setCurrentNiveau(null)
    setNewNiveauName("")
    setSelectedDepartementId("")
    setIsSubmitting(false)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNiveauName.trim()) {
      toast.error("Le nom du niveau ne peut pas être vide.", { duration: 3000 })
      return
    }
    if (!selectedDepartementId) {
      toast.error("Veuillez sélectionner un département.", { duration: 3000 })
      return
    }

    setIsSubmitting(true)
    const accessToken = localStorage.getItem("accessToken")
    const method = currentNiveau ? "PATCH" : "POST"
    const url = currentNiveau ? `http://localhost:3000/api/niveaux/${currentNiveau.id}` : "http://localhost:3000/api/niveaux"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nom: newNiveauName, departementId: selectedDepartementId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || `Échec de l'opération: ${method} ${response.status}`)
      }

      toast.success(`Niveau ${currentNiveau ? "mis à jour" : "créé"} avec succès.`, { duration: 3000 })
      handleCloseFormModal()
      fetchNiveaux() // Recharger les niveaux pour mettre à jour les comptes
    } catch (err: any) {
      console.error("Erreur lors de l'opération sur le niveau:", err)
      toast.error(err.message || "Une erreur est survenue lors de l'opération.", { duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setNiveauToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!niveauToDeleteId) return

    setIsSubmitting(true)
    const accessToken = localStorage.getItem("accessToken")

    try {
      const response = await fetch(`http://localhost:3000/api/niveaux/${niveauToDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || `Échec de la suppression: ${response.status}`)
      }

      toast.success("Niveau supprimé avec succès.", { duration: 3000 })
      setIsDeleteDialogOpen(false)
      setNiveauToDeleteId(null)
      fetchNiveaux() // Recharger les niveaux pour mettre à jour les comptes
    } catch (err: any) {
      console.error("Erreur lors de la suppression du niveau:", err)
      toast.error(err.message || "Une erreur est survenue lors de la suppression.", { duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center relative overflow-hidden">
        {/* Éléments décoratifs animés */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-96 h-96 bg-indigo-400/10 rounded-full -top-48 -left-48 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-64 h-64 bg-purple-400/10 rounded-full -bottom-32 -right-32 blur-3xl"
            animate={{
              scale: [1, 0.8, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-8 relative z-10"
        >
          <motion.div
            className="relative"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <div className="p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl">
              <Loader2 className="h-20 w-20 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
          </motion.div>
          <motion.div
            className="text-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Vérification de l'authentification
            </h2>
            <p className="text-gray-600 font-medium">Chargement de votre espace administrateur...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/20 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-96 h-96 bg-red-400/10 rounded-full -top-48 -left-48 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm border border-red-200/50 rounded-3xl p-16 shadow-2xl text-center max-w-2xl relative z-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="relative inline-block mb-8"
          >
            <div className="p-8 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl shadow-2xl">
              <AlertTriangle className="h-16 w-16 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-6">
              Erreur d'accès
            </h2>
            <p className="text-red-700 text-xl mb-8 leading-relaxed">{error}</p>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl hover:shadow-red-500/25 transition-all duration-300 px-10 py-4 rounded-2xl text-lg font-semibold cursor-pointer">
                <Shield className="mr-2 h-5 w-5" />
                Se Connecter
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Calcul des totaux pour les cartes de statistiques
  const totalNiveauxCount = niveaux.length; // Nombre de niveaux actifs
  const totalEtudiants = niveaux.reduce((sum, niveau) => sum + (niveau._count?.etudiants || 0), 0);
  const totalMatieres = niveaux.reduce((sum, niveau) => sum + (niveau._count?.matieres || 0), 0);
  const totalSeances = niveaux.reduce((sum, niveau) => sum + (niveau._count?.seances || 0), 0);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-indigo-400/8 rounded-full -top-48 -left-48 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-purple-400/8 rounded-full -bottom-32 -right-32 blur-3xl"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div
          className="absolute w-48 h-48 bg-blue-400/6 rounded-full top-1/3 right-1/4 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <Toaster position="top-right" richColors />

      <div className="p-6 lg:p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-[1400px] mx-auto space-y-8 relative z-10"
        >
          {/* Header Section avec recherche */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Titre principal avec recherche intégrée */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-6">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl shadow-2xl">
                    <GraduationCap className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
                </motion.div>
                <div>
                  <motion.h1
                    className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Niveaux
                  </motion.h1>
                  <motion.p
                    className="text-gray-600 text-xl mt-2 font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Gérez les niveaux d'études
                  </motion.p>
                </div>
              </div>

              {/* Recherche et bouton d'ajout */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <motion.div
                  className="relative min-w-[300px]"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher un niveau..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-gray-200/50 hover:border-indigo-300 focus:border-indigo-500 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl cursor-text"
                  />
                  {searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Badge
                        variant="secondary"
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 border border-indigo-200"
                      >
                        {filteredNiveaux.length}
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleOpenAddModal}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 px-8 py-3 rounded-2xl text-lg font-semibold h-12 relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <PlusCircle className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">Nouveau</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Statistiques rapides améliorées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Changed to lg:grid-cols-4 for better layout */}
              {/* Card: Total Niveaux */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-indigo-50/50 to-indigo-100/30 border border-indigo-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        >
                          {totalNiveauxCount}
                        </motion.p>
                        <p className="text-indigo-600 font-medium">Niveaux Actifs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Total Étudiants */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-green-50/50 to-green-100/30 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                        >
                          {totalEtudiants}
                        </motion.p>
                        <p className="text-green-600 font-medium">Total Étudiants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Total Matières */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                        >
                          {totalMatieres}
                        </motion.p>
                        <p className="text-blue-600 font-medium">Total Matières</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Total Séances */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-purple-50/50 to-purple-100/30 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Clock className="h-8 w-8 text-white" /> {/* Icône pour les séances */}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                        >
                          {totalSeances}
                        </motion.p>
                        <p className="text-purple-600 font-medium">Total Séances</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </motion.div>

          {/* Section principale - Liste des niveaux */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
              <CardHeader className="bg-gradient-to-r from-gray-50/80 via-indigo-50/50 to-purple-50/80 border-b border-gray-200/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                      <List className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                      Liste des Niveaux
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base font-medium">
                      Gérez tous vos niveaux d'études
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 relative z-10">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="relative mb-6"
                    >
                      <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl">
                        <Loader2 className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
                    </motion.div>
                    <p className="text-gray-600 text-xl font-semibold">Chargement des niveaux...</p>
                  </div>
                ) : filteredNiveaux.length === 0 ? (
                  <div className="text-center p-16">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="relative inline-block mb-8"
                    >
                      <div className="p-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl shadow-lg">
                        <Info className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl blur-xl opacity-20" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-4">
                      {searchTerm ? "Aucun résultat trouvé" : "Aucun niveau"}
                    </h3>
                    <p className="text-gray-500 text-lg">
                      {searchTerm
                        ? `Aucun niveau ne correspond à "${searchTerm}"`
                        : "Commencez par ajouter votre premier niveau"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gradient-to-r from-gray-50/80 to-indigo-50/50">
                        <TableRow className="border-b-2 border-gray-200/50">
                          {/* <TableHead className="text-gray-700 font-bold text-base py-4 px-6 w-32">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4" />
                              <span>ID</span>
                            </div>
                          </TableHead> */}
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Nom du Niveau</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>Département</span>
                            </div>
                          </TableHead>
                          {/* Nouvelle colonne pour les statistiques */}
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6 text-center">
                            <div className="flex items-center space-x-2 justify-center">
                              <TrendingUp className="h-4 w-4" />
                              <span>Statistiques</span>
                            </div>
                          </TableHead>
                          {/* Fin des nouvelles colonnes */}
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Statut</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-gray-700 font-bold text-base py-4 px-6">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredNiveaux.map((niveau, index) => (
                            <motion.tr
                              key={niveau.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/20 transition-all duration-300 group"
                            >
                              {/* <TableCell className="py-6 px-6 font-mono text-sm text-gray-500 w-32">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1 bg-gray-100 rounded group-hover:bg-indigo-100 transition-colors duration-300">
                                    <Hash className="h-3 w-3 text-gray-400 group-hover:text-indigo-500" />
                                  </div>
                                  <span className="truncate">{niveau.id.substring(0, 8)}...</span>
                                </div>
                              </TableCell> */}

                              <TableCell className="py-6 px-6">
                                <div className="flex items-center space-x-4">
                                  <motion.div
                                    className="relative"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                                      <GraduationCap className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                                  </motion.div>
                                  <div>
                                    <p className="font-bold text-gray-800 text-lg group-hover:text-indigo-700 transition-colors duration-300">
                                      {niveau.nom}
                                    </p>
                                    <p className="text-gray-500 text-sm">Niveau d'études</p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="py-6 px-6">
                                <div className="flex items-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                    <Badge
                                      variant="secondary"
                                      className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-3 py-1 text-sm font-medium border border-purple-200/50 shadow-sm"
                                    >
                                      <Building className="h-4 w-4 mr-1" />
                                      {niveau.departement ? niveau.departement.nom : "N/A"}
                                    </Badge>
                                  </motion.div>
                                </div>
                              </TableCell>

                              {/* Affichage des comptes avec labels dans la colonne Statistiques */}
                              <TableCell className="py-6 px-6 text-center">
                                <div className="flex flex-col items-center justify-center gap-2"> {/* Changed to flex-col for better stacking of badges */}
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                    <Users className="h-4 w-4 mr-1.5" />
                                    {niveau._count?.etudiants || 0} Étudiants
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                    <BookOpen className="h-4 w-4 mr-1.5" />
                                    {niveau._count?.matieres || 0} Matières
                                  </Badge>
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                    <Clock className="h-4 w-4 mr-1.5" />
                                    {niveau._count?.seances || 0} Séances
                                  </Badge>
                                </div>
                              </TableCell>
                              {/* Fin de l'affichage des comptes */}

                              <TableCell className="py-6 px-6">
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 text-sm font-medium border border-green-200/50 shadow-sm"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Actif
                                  </Badge>
                                </motion.div>
                              </TableCell>

                              <TableCell className="text-center py-6 px-6">
                                <div className="flex items-center justify-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditModal(niveau)}
                                      className="text-indigo-600 border-indigo-300/50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-500 transition-all duration-300 px-6 py-3 shadow-sm hover:shadow-md backdrop-blur-sm h-10 cursor-pointer"
                                    >
                                      <span className="flex items-center justify-center">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                      </span>
                                    </Button>
                                  </motion.div>

                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleOpenDeleteDialog(niveau.id)}
                                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 px-6 py-3 h-10 cursor-pointer"
                                    >
                                      <span className="flex items-center justify-center">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </span>
                                    </Button>
                                  </motion.div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Modale d'ajout/édition de niveau ultra-moderne */}
      <AnimatePresence>
        {isFormModalOpen && (
          <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none overflow-visible">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative"
              >
                {/* Éléments décoratifs */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />

                {/* Header avec dégradé ultra-moderne */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
                  <DialogHeader className="relative z-10">
                    <DialogTitle className="text-3xl font-bold mb-2 flex items-center">
                      <motion.div
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4 border border-white/30"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <GraduationCap className="h-8 w-8" />
                      </motion.div>
                      {currentNiveau ? "Modifier le niveau" : "Créer un niveau"}
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 text-lg font-medium">
                      {currentNiveau
                        ? "Modifiez les informations du niveau sélectionné"
                        : "Ajoutez un nouveau niveau d'études à votre institution"}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Éléments décoratifs dans le header */}
                  <motion.div
                    className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute bottom-4 left-4 w-8 h-8 bg-white/10 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  />
                </div>

                {/* Contenu du formulaire ultra-amélioré */}
                <form onSubmit={handleSubmitForm} className="p-6 space-y-8 relative z-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="niveauName" className="text-lg font-bold text-gray-700 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
                        Nom du niveau
                      </Label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                        <Input
                          id="niveauName"
                          value={newNiveauName}
                          onChange={(e) => setNewNiveauName(e.target.value)}
                          placeholder="Ex: L1, M2, Doctorat..."
                          className="h-16 text-lg border-2 border-gray-200/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl pl-12 pr-6 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl cursor-text"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-focus-within:from-indigo-500/5 group-focus-within:to-purple-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="departementSelect" className="text-lg font-bold text-gray-700 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-purple-600" />
                        Département
                      </Label>
                      <div className="relative group">
                        <Select onValueChange={setSelectedDepartementId} value={selectedDepartementId}>
                          <SelectTrigger className="h-16 text-lg border-2 border-gray-200/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-2xl pl-6 pr-6 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl cursor-pointer">
                            <SelectValue placeholder="Sélectionner un département">
                              {selectedDepartementId ? (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-5 w-5 text-gray-400" />
                                  <span>{departements.find(dep => dep.id === selectedDepartementId)?.nom}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-gray-500">
                                  <Building className="h-5 w-5 text-gray-400" />
                                  <span>Sélectionner un département</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2 border-gray-200/50 shadow-2xl backdrop-blur-xl bg-white/95">
                            {departements.length === 0 ? (
                              <SelectItem value="no-departements" disabled className="text-gray-500 italic">
                                Aucun département disponible
                              </SelectItem>
                            ) : (
                              departements.map((dep) => (
                                <SelectItem
                                  key={dep.id}
                                  value={dep.id}
                                  className="hover:bg-purple-50 focus:bg-purple-50 transition-colors duration-200 rounded-xl m-1 cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Building className="h-4 w-4 text-purple-500" />
                                    <span>{dep.nom}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/5 group-focus-within:to-indigo-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-4 pt-8 border-t border-gray-100/50">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseFormModal}
                        className="w-full sm:w-auto px-8 py-3 h-12 rounded-xl text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold bg-transparent cursor-pointer"
                        disabled={isSubmitting}
                      >
                        <span className="flex items-center justify-center">Annuler</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200 font-semibold relative overflow-hidden group cursor-pointer"
                        disabled={isSubmitting}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {isSubmitting ? (
                          <span className="flex items-center justify-center relative z-10">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            {currentNiveau ? "Modification..." : "Création..."}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center relative z-10">
                            {currentNiveau ? (
                              <>
                                <Edit className="h-5 w-5 mr-2" />
                                Sauvegarder
                              </>
                            ) : (
                              <>
                                <PlusCircle className="h-5 w-5 mr-2" />
                                Créer
                              </>
                            )}
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Boîte de dialogue de suppression ultra-dramatique */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-white rounded-3xl shadow-2xl border-0 overflow-hidden max-w-lg p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header avec couleur rouge élégante */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-3xl font-bold flex items-center">
                      <motion.div className="p-3 bg-white/20 rounded-2xl mr-4" whileHover={{ rotate: 10, scale: 1.1 }}>
                        <AlertTriangle className="h-8 w-8" />
                      </motion.div>
                      Suppression du niveau
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-red-100 text-lg mt-4">
                      Êtes-vous sûr de vouloir supprimer définitivement ce niveau ? Cette action est irréversible et
                      tous les étudiants ou matières liées à ce niveau pourraient être affectés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>

                {/* Actions avec background étendu */}
                <div className="p-6 bg-white">
                  <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <AlertDialogCancel asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto px-8 py-3 h-12 rounded-xl text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold bg-transparent cursor-pointer"
                          disabled={isSubmitting}
                        >
                          <span className="flex items-center justify-center">Annuler</span>
                        </Button>
                      </AlertDialogCancel>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <AlertDialogAction asChild>
                        <Button
                          onClick={handleDeleteConfirm}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3 h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200 font-semibold cursor-pointer"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Suppression...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <Trash2 className="h-5 w-5 mr-2" />
                              Supprimer
                            </span>
                          )}
                        </Button>
                      </AlertDialogAction>
                    </motion.div>
                  </AlertDialogFooter>
                </div>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
    </div>
  )
}
