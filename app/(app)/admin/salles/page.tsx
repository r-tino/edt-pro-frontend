// src/app/(app)/salles/page.tsx
'use client'; // Ce composant est un Client Component.

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  List,
  AlertTriangle,
  Info,
  Hash,
  Shield,
  Star,
  CheckCircle,
  Search,
  Users, // Pour la capacité
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

// Importation de Sonner pour les notifications
import { Toaster, toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

// Interfaces pour correspondre à la structure des données du backend
enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

interface Salle {
  id: string
  nom: string
  type: string
  capacite: number
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

export default function SallesPage() {
  const router = useRouter()
  const [salles, setSalles] = useState<Salle[]>([])
  const [filteredSalles, setFilteredSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [currentSalle, setCurrentSalle] = useState<Salle | null>(null)
  const [newSalleName, setNewSalleName] = useState("")
  const [newSalleType, setNewSalleType] = useState("")
  const [newSalleCapacite, setNewSalleCapacite] = useState<number | string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [salleToDeleteId, setSalleToDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animations variants
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
          setError("Accès refusé. Seuls les administrateurs peuvent gérer les salles.")
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

  // Fonction pour récupérer les salles
  const fetchSalles = useCallback(async () => {
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

    try {
      const response = await fetch(`${API_URL}/api/salles`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération des salles.")
      }

      const result = await response.json()
      setSalles(result.data || [])
      setFilteredSalles(result.data || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des salles:", err)
      setError(err.message || "Impossible de charger les salles.")
    } finally {
      setLoading(false)
    }
  }, [user])

  // Déclencher le chargement initial des salles
  useEffect(() => {
    if (user && user.role === Role.ADMIN) {
      fetchSalles()
    }
  }, [user, fetchSalles])

  // Filtrage des salles
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSalles(salles)
    } else {
      const filtered = salles.filter(
        (salle) =>
          salle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salle.capacite.toString().includes(searchTerm.toLowerCase()),
      )
      setFilteredSalles(filtered)
    }
  }, [searchTerm, salles])

  const handleOpenAddModal = () => {
    setCurrentSalle(null)
    setNewSalleName("")
    setNewSalleType("")
    setNewSalleCapacite("")
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (salle: Salle) => {
    setCurrentSalle(salle)
    setNewSalleName(salle.nom)
    setNewSalleType(salle.type)
    setNewSalleCapacite(salle.capacite)
    setIsFormModalOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setCurrentSalle(null)
    setNewSalleName("")
    setNewSalleType("")
    setNewSalleCapacite("")
    setIsSubmitting(false)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSalleName.trim()) {
      toast.error("Le nom de la salle ne peut pas être vide.", { duration: 3000 })
      return
    }
    if (!newSalleType.trim()) {
      toast.error("Le type de la salle ne peut pas être vide.", { duration: 3000 })
      return
    }
    if (typeof newSalleCapacite !== 'number' || newSalleCapacite <= 0) {
      toast.error("La capacité doit être un nombre positif.", { duration: 3000 })
      return
    }

    setIsSubmitting(true)
    const accessToken = localStorage.getItem("accessToken")
    const method = currentSalle ? "PATCH" : "POST"
    const url = currentSalle ? `${API_URL}/api/salles/${currentSalle.id}` : `${API_URL}/api/salles`

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nom: newSalleName,
          type: newSalleType,
          capacite: Number(newSalleCapacite),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || `Échec de l'opération: ${method} ${response.status}`)
      }

      toast.success(`Salle ${currentSalle ? "mise à jour" : "créée"} avec succès.`, { duration: 3000 })
      handleCloseFormModal()
      fetchSalles() // Recharger les salles
    } catch (err: any) {
      console.error("Erreur lors de l'opération sur la salle:", err)
      toast.error(err.message || "Une erreur est survenue lors de l'opération.", { duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setSalleToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!salleToDeleteId) return

    setIsSubmitting(true)
    const accessToken = localStorage.getItem("accessToken")

    try {
      const response = await fetch(`${API_URL}/api/salles/${salleToDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || `Échec de la suppression: ${response.status}`)
      }

      toast.success("Salle supprimée avec succès.", { duration: 3000 })
      setIsDeleteDialogOpen(false)
      setSalleToDeleteId(null)
      fetchSalles() // Recharger les salles
    } catch (err: any) {
      console.error("Erreur lors de la suppression de la salle:", err)
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
  const totalSallesCount = salles.length;
  const totalCapacite = salles.reduce((sum, salle) => sum + salle.capacite, 0);


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
                    <Building className="h-12 w-12 text-white" />
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
                    Salles
                  </motion.h1>
                  <motion.p
                    className="text-gray-600 text-xl mt-2 font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Gérez les salles de cours et amphithéâtres
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
                    placeholder="Rechercher une salle..."
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
                        {filteredSalles.length}
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
                    <span className="relative z-10">Nouvelle Salle</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Statistiques rapides améliorées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card: Total Salles */}
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
                          <Building className="h-8 w-8 text-white" />
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
                          {totalSallesCount}
                        </motion.p>
                        <p className="text-green-600 font-medium">Salles Actives</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Total Capacité */}
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
                          <Users className="h-8 w-8 text-white" />
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
                          {totalCapacite}
                        </motion.p>
                        <p className="text-blue-600 font-medium">Capacité Totale</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Section principale - Liste des salles */}
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
                      Liste des Salles
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base font-medium">
                      Gérez toutes les salles disponibles pour les cours
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
                    <p className="text-gray-600 text-xl font-semibold">Chargement des salles...</p>
                  </div>
                ) : filteredSalles.length === 0 ? (
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
                      {searchTerm ? "Aucun résultat trouvé" : "Aucune salle"}
                    </h3>
                    <p className="text-gray-500 text-lg">
                      {searchTerm
                        ? `Aucune salle ne correspond à "${searchTerm}"`
                        : "Commencez par ajouter votre première salle"}
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
                              <Building className="h-4 w-4" />
                              <span>Nom de la Salle</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <List className="h-4 w-4" />
                              <span>Type</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Capacité</span>
                            </div>
                          </TableHead>
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
                          {filteredSalles.map((salle, index) => (
                            <motion.tr
                              key={salle.id}
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
                                  <span className="truncate">{salle.id.substring(0, 8)}...</span>
                                </div>
                              </TableCell> */}

                              <TableCell className="py-6 px-6">
                                <div className="flex items-center space-x-4">
                                  <motion.div
                                    className="relative"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                                      <Building className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                                  </motion.div>
                                  <div>
                                    <p className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors duration-300">
                                      {salle.nom}
                                    </p>
                                    <p className="text-gray-500 text-sm">Nom de la salle</p>
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
                                      {salle.type}
                                    </Badge>
                                  </motion.div>
                                </div>
                              </TableCell>

                              <TableCell className="py-6 px-6">
                                <div className="flex items-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                    <Badge
                                      variant="secondary"
                                      className="bg-gradient-to-r from-pink-100 to-red-100 text-red-800 px-3 py-1 text-sm font-medium border border-red-200/50 shadow-sm"
                                    >
                                      <Users className="h-4 w-4 mr-1" />
                                      {salle.capacite} places
                                    </Badge>
                                  </motion.div>
                                </div>
                              </TableCell>

                              <TableCell className="py-6 px-6">
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 text-sm font-medium border border-green-200/50 shadow-sm"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Disponible
                                  </Badge>
                                </motion.div>
                              </TableCell>

                              <TableCell className="text-center py-6 px-6">
                                <div className="flex items-center justify-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditModal(salle)}
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
                                      onClick={() => handleOpenDeleteDialog(salle.id)}
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

      {/* Modale d'ajout/édition de salle */}
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
                        <Building className="h-8 w-8" />
                      </motion.div>
                      {currentSalle ? "Modifier la salle" : "Créer une salle"}
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 text-lg font-medium">
                      {currentSalle
                        ? "Modifiez les informations de la salle sélectionnée"
                        : "Ajoutez une nouvelle salle de cours ou amphithéâtre"}
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

                {/* Contenu du formulaire */}
                <form onSubmit={handleSubmitForm} className="p-6 space-y-8 relative z-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="salleName" className="text-lg font-bold text-gray-700 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-blue-600" />
                        Nom de la salle
                      </Label>
                      <div className="relative group">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                        <Input
                          id="salleName"
                          value={newSalleName}
                          onChange={(e) => setNewSalleName(e.target.value)}
                          placeholder="Ex: Amphi A, Salle 101, Labo Info..."
                          className="h-16 text-lg border-2 border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl pl-12 pr-6 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl cursor-text"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="salleType" className="text-lg font-bold text-gray-700 flex items-center">
                        <List className="h-5 w-5 mr-2 text-purple-600" />
                        Type de salle
                      </Label>
                      <div className="relative group">
                        <List className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" />
                        <Input
                          id="salleType"
                          value={newSalleType}
                          onChange={(e) => setNewSalleType(e.target.value)}
                          placeholder="Ex: Amphithéâtre, Salle de cours, Laboratoire..."
                          className="h-16 text-lg border-2 border-gray-200/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-2xl pl-12 pr-6 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl cursor-text"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/5 group-focus-within:to-indigo-500/5 transition-all duration-300 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="salleCapacite" className="text-lg font-bold text-gray-700 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-orange-600" />
                        Capacité
                      </Label>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300" />
                        <Input
                          id="salleCapacite"
                          type="number"
                          value={newSalleCapacite}
                          onChange={(e) => setNewSalleCapacite(Number(e.target.value))}
                          placeholder="Ex: 50, 100, 200..."
                          min="1"
                          className="h-16 text-lg border-2 border-gray-200/50 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-2xl pl-12 pr-6 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl cursor-text"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 to-red-500/0 group-focus-within:from-orange-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none" />
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
                            {currentSalle ? "Modification..." : "Création..."}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center relative z-10">
                            {currentSalle ? (
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

      {/* Boîte de dialogue de suppression */}
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
                      Suppression de la salle
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-red-100 text-lg mt-4">
                      Êtes-vous sûr de vouloir supprimer définitivement cette salle ? Cette action est irréversible et
                      toutes les séances liées à cette salle pourraient être affectées.
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
