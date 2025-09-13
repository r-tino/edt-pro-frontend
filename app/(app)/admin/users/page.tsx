"use client" // Ce composant est un Client Component.

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  List,
  AlertTriangle,
  Info,
  Hash,
  Shield,
  Search,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Briefcase,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Pour la sélection du rôle

// Importation de Sonner pour les notifications
import { Toaster, toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

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
  departement: Departement // Inclut le département lié
}

interface Matiere {
  id: string
  nom: string
  niveauId: string
  niveau: Niveau // Inclut le niveau lié
}

interface EnseignantMatiere {
  matiereId: string
  niveauId: string // Ajouté pour la logique frontend, même si pas stocké directement dans la table de liaison
}

interface Utilisateur {
  id: string
  nom: string
  email: string
  role: Role
  enseignant?: {
    id: string
    poste?: string | null
    matieres: { matiereId: string; matiere: Matiere }[] // Matières enseignées
  }
  etudiant?: {
    id: string
    matricule?: string | null
    niveauId?: string
    niveau?: Niveau // Niveau de l'étudiant
  }
}

interface UserInfo {
  id: string
  nom: string
  email: string
  role: Role
}

export default function UsersPage() {
  const router = useRouter()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState<Utilisateur[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null) // Utilisateur connecté
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Utilisateur | null>(null) // Utilisateur en cours d'édition
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<Role>(Role.ETUDIANT) // Par défaut

  // Champs spécifiques aux profils
  const [etudiantMatricule, setEtudiantMatricule] = useState<string>("")
  const [etudiantNiveauId, setEtudiantNiveauId] = useState<string>("")
  const [enseignantPoste, setEnseignantPoste] = useState<string>("")
  const [enseignantMatieresNiveaux, setEnseignantMatieresNiveaux] = useState<EnseignantMatiere[]>([])

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null)
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

  // Chargement initial de l'utilisateur connecté et vérification du rôle
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        if (parsedUser.role !== Role.ADMIN) {
          setError("Accès refusé. Seuls les administrateurs peuvent gérer les utilisateurs.")
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

  // Fonctions pour récupérer les données nécessaires
  const fetchNiveaux = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/niveaux`, {
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
      // MODIFICATION ICI: Accédez à la propriété 'data' si elle existe, sinon utilisez le résultat directement
      setNiveaux(result.data || result || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des niveaux:", err)
      toast.error(`Erreur chargement niveaux: ${err.message}`, { duration: 5000 })
    }
  }, [])

  const fetchMatieres = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/matieres`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération des matières.")
      }
      const result = await response.json()
      // MODIFICATION ICI: Accédez à la propriété 'data' si elle existe, sinon utilisez le résultat directement
      setMatieres(result.data || result || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des matières:", err)
      toast.error(`Erreur chargement matières: ${err.message}`, { duration: 5000 })
    }
  }, [])

  const fetchUtilisateurs = useCallback(async () => {
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

    // Charger les niveaux et matières d'abord pour les dropdowns
    await Promise.all([fetchNiveaux(accessToken), fetchMatieres(accessToken)])

    try {
      const response = await fetch(`${API_URL}/api/utilisateurs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération des utilisateurs.")
      }

      const result = await response.json()
      // MODIFICATION CLÉ ICI : Vérifiez si la propriété 'data' existe, sinon utilisez 'result' directement
      const usersData = result.data || result

      setUtilisateurs(usersData || [])
      setFilteredUtilisateurs(usersData || [])
    } catch (err: any) {
      console.error("Erreur lors de la récupération des utilisateurs:", err)
      setError(err.message || "Impossible de charger les utilisateurs.")
    } finally {
      setLoading(false)
    }
  }, [user, fetchNiveaux, fetchMatieres])

  // Déclencher le chargement initial des utilisateurs
  useEffect(() => {
    if (user && user.role === Role.ADMIN) {
      fetchUtilisateurs()
    }
  }, [user, fetchUtilisateurs])

  // Filtrage des utilisateurs
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUtilisateurs(utilisateurs)
    } else {
      const filtered = utilisateurs.filter(
        (u) =>
          u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.etudiant?.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.etudiant?.niveau?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.enseignant?.poste?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUtilisateurs(filtered)
    }
  }, [searchTerm, utilisateurs])

  const handleOpenAddModal = () => {
    setCurrentUser(null)
    setNewUserName("")
    setNewUserEmail("")
    setNewUserPassword("")
    setConfirmNewUserPassword("")
    setNewUserRole(Role.ETUDIANT) // Valeur par défaut pour l'ajout
    setEtudiantMatricule("")
    setEtudiantNiveauId("")
    setEnseignantPoste("")
    setEnseignantMatieresNiveaux([])
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (utilisateur: Utilisateur) => {
    setCurrentUser(utilisateur)
    setNewUserName(utilisateur.nom)
    setNewUserEmail(utilisateur.email)
    setNewUserRole(utilisateur.role)
    setNewUserPassword("") // Ne pas pré-remplir le mot de passe pour la modification
    setConfirmNewUserPassword("")

    // Pré-remplir les champs spécifiques au profil
    if (utilisateur.role === Role.ETUDIANT && utilisateur.etudiant) {
      setEtudiantMatricule(utilisateur.etudiant.matricule || "")
      setEtudiantNiveauId(utilisateur.etudiant.niveauId || "")
    } else {
      setEtudiantMatricule("")
      setEtudiantNiveauId("")
    }

    if (utilisateur.role === Role.ENSEIGNANT && utilisateur.enseignant) {
      setEnseignantPoste(utilisateur.enseignant.poste || "")
      setEnseignantMatieresNiveaux(
        utilisateur.enseignant.matieres.map((em) => ({
          matiereId: em.matiereId,
          niveauId: em.matiere.niveau.id, // Récupère le niveau de la matière
        })),
      )
    } else {
      setEnseignantPoste("")
      setEnseignantMatieresNiveaux([])
    }

    setIsFormModalOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setCurrentUser(null)
    setNewUserName("")
    setNewUserEmail("")
    setNewUserPassword("")
    setConfirmNewUserPassword("")
    setNewUserRole(Role.ETUDIANT)
    setEtudiantMatricule("")
    setEtudiantNiveauId("")
    setEnseignantPoste("")
    setEnseignantMatieresNiveaux([])
    setIsSubmitting(false)
  }

  const handleAddMatiereNiveau = () => {
    setEnseignantMatieresNiveaux([...enseignantMatieresNiveaux, { matiereId: "", niveauId: "" }])
  }

  const handleRemoveMatiereNiveau = (index: number) => {
    const newMatieresNiveaux = enseignantMatieresNiveaux.filter((_, i) => i !== index)
    setEnseignantMatieresNiveaux(newMatieresNiveaux)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Le nom et l'email sont obligatoires.", { duration: 3000 })
      return
    }

    if (!currentUser && (!newUserPassword || newUserPassword.length < 6)) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.", { duration: 3000 })
      return
    }

    if (!currentUser && newUserPassword !== confirmNewUserPassword) {
      toast.error("Les mots de passe ne correspondent pas.", { duration: 3000 })
      return
    }

    // Validation spécifique au rôle
    if (newUserRole === Role.ETUDIANT && !etudiantNiveauId) {
      toast.error("Le niveau est obligatoire pour un étudiant.", { duration: 3000 })
      return
    }

    if (newUserRole === Role.ENSEIGNANT && enseignantMatieresNiveaux.some((mn) => !mn.matiereId || !mn.niveauId)) {
      toast.error("Toutes les matières enseignées doivent avoir une matière et un niveau sélectionnés.", {
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)

    const accessToken = localStorage.getItem("accessToken")
    const method = currentUser ? "PATCH" : "POST"
    const url = currentUser
      ? `${API_URL}/api/utilisateurs/${currentUser.id}`
      : `${API_URL}/api/auth/register`

    const payload: any = {
      nom: newUserName,
      email: newUserEmail,
      role: newUserRole,
    }

    if (!currentUser) {
      // Pour l'enregistrement (création)
      payload.motDePasse = newUserPassword
      payload.confirmMotDePasse = confirmNewUserPassword // Seulement pour le DTO de register
    } else {
      // Pour la mise à jour
      // Si le mot de passe est modifié, l'inclure
      if (newUserPassword.length >= 6) {
        payload.motDePasse = newUserPassword
      }
    }

    if (newUserRole === Role.ETUDIANT) {
      payload.etudiantProfile = {
        matricule: etudiantMatricule || null,
        niveauId: etudiantNiveauId,
      }
    } else if (newUserRole === Role.ENSEIGNANT) {
      payload.enseignantProfile = {
        poste: enseignantPoste || null,
        matieresNiveaux: enseignantMatieresNiveaux.map((mn) => ({
          matiereId: mn.matiereId,
          niveauId: mn.niveauId, // Le backend a besoin du niveauId pour valider la matière
        })),
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessageText = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message || `Échec de l'opération: ${method} ${response.status}`
        throw new Error(errorMessageText)
      }

      toast.success(`Utilisateur ${currentUser ? "mis à jour" : "créé"} avec succès.`, { duration: 3000 })
      handleCloseFormModal()
      fetchUtilisateurs() // Recharger les utilisateurs
    } catch (err: any) {
      console.error("Erreur lors de l'opération sur l'utilisateur:", err)
      toast.error(err.message || "Une erreur est survenue lors de l'opération.", { duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteDialog = (id: string) => {
    setUserToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDeleteId) return

    setIsSubmitting(true)
    const accessToken = localStorage.getItem("accessToken")

    try {
      const response = await fetch(`${API_URL}/api/utilisateurs/${userToDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Échec de la suppression: ${response.status}`)
      }

      toast.success("Utilisateur supprimé avec succès.", { duration: 3000 })
      setIsDeleteDialogOpen(false)
      setUserToDeleteId(null)
      fetchUtilisateurs() // Recharger les utilisateurs
    } catch (err: any) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err)
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
  const totalUsersCount = utilisateurs.length
  const adminCount = utilisateurs.filter((u) => u.role === Role.ADMIN).length
  const etudiantCount = utilisateurs.filter((u) => u.role === Role.ETUDIANT).length
  const enseignantCount = utilisateurs.filter((u) => u.role === Role.ENSEIGNANT).length

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
                    <Users className="h-12 w-12 text-white" />
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
                    Gestion des Utilisateurs
                  </motion.h1>
                  <motion.p
                    className="text-gray-600 text-xl mt-2 font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Gérez les comptes administrateurs, enseignants et étudiants
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
                    placeholder="Rechercher un utilisateur..."
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
                        {filteredUtilisateurs.length}
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
                    <span className="relative z-10">Nouvel Utilisateur</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Statistiques rapides améliorées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card: Total Utilisateurs */}
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
                          {totalUsersCount}
                        </motion.p>
                        <p className="text-blue-600 font-medium">Utilisateurs au total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Administrateurs */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-purple-50/50 to-purple-100/30 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Shield className="h-8 w-8 text-white" />
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
                          {adminCount}
                        </motion.p>
                        <p className="text-purple-600 font-medium">Administrateurs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Enseignants */}
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
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                        >
                          {enseignantCount}
                        </motion.p>
                        <p className="text-green-600 font-medium">Enseignants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card: Étudiants */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="bg-gradient-to-br from-white via-orange-50/50 to-orange-100/30 border border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-3xl font-bold bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                        >
                          {etudiantCount}
                        </motion.p>
                        <p className="text-orange-600 font-medium">Étudiants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Section principale - Liste des utilisateurs */}
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
                      Liste des Utilisateurs
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base font-medium">
                      Gérez tous les comptes utilisateurs de la plateforme
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
                    <p className="text-gray-600 text-xl font-semibold">Chargement des utilisateurs...</p>
                  </div>
                ) : filteredUtilisateurs.length === 0 ? (
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
                      {searchTerm ? "Aucun résultat trouvé" : "Aucun utilisateur"}
                    </h3>
                    <p className="text-gray-500 text-lg">
                      {searchTerm
                        ? `Aucun utilisateur ne correspond à "${searchTerm}"`
                        : "Commencez par ajouter votre premier utilisateur"}
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
                              <User className="h-4 w-4" />
                              <span>Nom</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>Email</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Rôle</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 font-bold text-base py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Info className="h-4 w-4" />
                              <span>Détails du Profil</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center text-gray-700 font-bold text-base py-4 px-6">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredUtilisateurs.map((utilisateur, index) => (
                            <motion.tr
                              key={utilisateur.id}
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
                                  <span className="truncate">{utilisateur.id.substring(0, 8)}...</span>
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
                                      <User className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                                  </motion.div>
                                  <div>
                                    <p className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors duration-300">
                                      {utilisateur.nom}
                                    </p>
                                    <p className="text-gray-500 text-sm">Nom complet</p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="py-6 px-6">
                                <p className="text-gray-700 font-medium">{utilisateur.email}</p>
                              </TableCell>

                              <TableCell className="py-6 px-6">
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                                  <Badge
                                    variant="secondary"
                                    className={`px-3 py-1 text-sm font-medium border shadow-sm ${
                                      utilisateur.role === Role.ADMIN
                                        ? "bg-purple-100 text-purple-800 border-purple-200/50"
                                        : utilisateur.role === Role.ENSEIGNANT
                                          ? "bg-green-100 text-green-800 border-green-200/50"
                                          : "bg-orange-100 text-orange-800 border-orange-200/50"
                                    }`}
                                  >
                                    {utilisateur.role}
                                  </Badge>
                                </motion.div>
                              </TableCell>

                              <TableCell className="py-6 px-6 text-gray-600 text-sm">
                                {utilisateur.role === Role.ETUDIANT && utilisateur.etudiant ? (
                                  <div className="space-y-1">
                                    <div>
                                      Matricule:{" "}
                                      <span className="font-medium">{utilisateur.etudiant.matricule || "N/A"}</span>
                                    </div>
                                    <div>
                                      Niveau:{" "}
                                      <span className="font-medium">{utilisateur.etudiant.niveau?.nom || "N/A"}</span>
                                    </div>
                                    <div>
                                      Département:{" "}
                                      <span className="font-medium">
                                        {utilisateur.etudiant.niveau?.departement?.nom || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                ) : utilisateur.role === Role.ENSEIGNANT && utilisateur.enseignant ? (
                                  <div className="space-y-1">
                                    <div>
                                      Poste:{" "}
                                      <span className="font-medium">{utilisateur.enseignant.poste || "N/A"}</span>
                                    </div>
                                    <div>
                                      Matières:
                                      <div className="ml-4 mt-1">
                                        {utilisateur.enseignant.matieres.length > 0 ? (
                                          utilisateur.enseignant.matieres.map((em, idx) => (
                                            <div key={idx} className="text-xs">
                                              • {em.matiere.nom} ({em.matiere.niveau.nom})
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-xs italic">Aucune</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="italic text-gray-500">Aucun détail spécifique</p>
                                )}
                              </TableCell>

                              <TableCell className="text-center py-6 px-6">
                                <div className="flex items-center justify-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditModal(utilisateur)}
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
                                      onClick={() => handleOpenDeleteDialog(utilisateur.id)}
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

      {/* Modale d'ajout/édition d'utilisateur */}
      <AnimatePresence>
        {isFormModalOpen && (
          <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 bg-transparent border-0 shadow-none overflow-visible">
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
                        <User className="h-8 w-8" />
                      </motion.div>
                      {currentUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 text-lg font-medium">
                      {currentUser
                        ? "Modifiez les informations de l'utilisateur sélectionné"
                        : "Ajoutez un nouvel utilisateur avec son rôle et profil"}
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
                    {/* Nom et Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="userName" className="text-lg font-bold text-gray-700 flex items-center">
                          <User className="h-5 w-5 mr-2 text-blue-600" />
                          Nom Complet
                        </Label>
                        <Input
                          id="userName"
                          name="userName"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Ex: Jean Dupont"
                          className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="userEmail" className="text-lg font-bold text-gray-700 flex items-center">
                          <Mail className="h-5 w-5 mr-2 text-blue-600" />
                          Email
                        </Label>
                        <Input
                          id="userEmail"
                          name="userEmail"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Ex: jean.dupont@example.com"
                          className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          disabled={!!currentUser} // Désactiver l'email en mode modification
                        />
                      </div>
                    </div>

                    {/* Mot de passe (seulement pour la création ou si modifié) */}
                    {!currentUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="password" className="text-lg font-bold text-gray-700 flex items-center">
                            Mot de passe
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-lg font-bold text-gray-700 flex items-center"
                          >
                            Confirmer le mot de passe
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={confirmNewUserPassword}
                            onChange={(e) => setConfirmNewUserPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {currentUser && ( // Option pour changer le mot de passe en mode édition
                      <div className="space-y-3">
                        <Label htmlFor="newPassword" className="text-lg font-bold text-gray-700 flex items-center">
                          Nouveau mot de passe (laisser vide pour ne pas changer)
                        </Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                        />
                      </div>
                    )}

                    {/* Sélection du rôle */}
                    <div className="space-y-3">
                      <Label className="text-lg font-bold text-gray-700 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-purple-600" />
                        Rôle
                      </Label>
                      <RadioGroup
                        onValueChange={(value: Role) => setNewUserRole(value)}
                        value={newUserRole}
                        className="flex flex-col sm:flex-row space-y-2 sm:space-x-4 sm:space-y-0"
                        disabled={!!currentUser} // Désactiver le changement de rôle en mode modification
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={Role.ETUDIANT} id="role-etudiant" />
                          <Label htmlFor="role-etudiant" className="font-normal text-gray-800 cursor-pointer">
                            Étudiant
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={Role.ENSEIGNANT} id="role-enseignant" />
                          <Label htmlFor="role-enseignant" className="font-normal text-gray-800 cursor-pointer">
                            Enseignant
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={Role.ADMIN} id="role-admin" />
                          <Label htmlFor="role-admin" className="font-normal text-gray-800 cursor-pointer">
                            Administrateur
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Champs spécifiques au rôle Étudiant */}
                    {newUserRole === Role.ETUDIANT && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 p-4 border border-blue-200 rounded-xl bg-blue-50/50"
                      >
                        <h3 className="text-xl font-bold text-blue-700 flex items-center">
                          <GraduationCap className="h-6 w-6 mr-2" />
                          Profil Étudiant
                        </h3>
                        <div className="space-y-3">
                          <Label
                            htmlFor="etudiantMatricule"
                            className="text-lg font-bold text-gray-700 flex items-center"
                          >
                            Matricule (Optionnel)
                          </Label>
                          <Input
                            id="etudiantMatricule"
                            name="etudiantMatricule"
                            value={etudiantMatricule}
                            onChange={(e) => setEtudiantMatricule(e.target.value)}
                            placeholder="Ex: ETU2025001"
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-white/80 shadow-sm"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="etudiantNiveau" className="text-lg font-bold text-gray-700 flex items-center">
                            Niveau
                          </Label>
                          <Select onValueChange={setEtudiantNiveauId} value={etudiantNiveauId}>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-white/80 shadow-sm">
                              <SelectValue placeholder="Sélectionnez un niveau" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-gray-200/50 shadow-lg backdrop-blur-xl bg-white/95">
                              {niveaux.map((niv) => (
                                <SelectItem key={niv.id} value={niv.id}>
                                  {`${niv.nom} (${niv.departement.nom})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    )}

                    {/* Champs spécifiques au rôle Enseignant */}
                    {newUserRole === Role.ENSEIGNANT && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 p-4 border border-green-200 rounded-xl bg-green-50/50"
                      >
                        <h3 className="text-xl font-bold text-green-700 flex items-center">
                          <Briefcase className="h-6 w-6 mr-2" />
                          Profil Enseignant
                        </h3>

                        <div className="space-y-3">
                          <Label
                            htmlFor="enseignantPoste"
                            className="text-lg font-bold text-gray-700 flex items-center"
                          >
                            Poste (Optionnel)
                          </Label>
                          <Input
                            id="enseignantPoste"
                            name="enseignantPoste"
                            value={enseignantPoste}
                            onChange={(e) => setEnseignantPoste(e.target.value)}
                            placeholder="Ex: Professeur de Mathématiques"
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-green-500 rounded-xl px-4 transition-all duration-300 bg-white/80 shadow-sm"
                          />
                        </div>

                        <Label className="text-lg font-bold text-gray-700 flex items-center">
                          <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                          Matières Enseignées
                        </Label>

                        {enseignantMatieresNiveaux.map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 items-end bg-white/70 p-3 rounded-lg border border-gray-100 shadow-sm"
                          >
                            <div className="flex-1 w-full space-y-1">
                              <Label htmlFor={`matiere-${index}`} className="text-sm text-gray-600">
                                Matière
                              </Label>
                              <Select
                                onValueChange={(value) => {
                                  const updated = [...enseignantMatieresNiveaux]
                                  updated[index].matiereId = value
                                  setEnseignantMatieresNiveaux(updated)
                                }}
                                value={item.matiereId}
                              >
                                <SelectTrigger
                                  id={`matiere-${index}`}
                                  className="h-10 text-sm border-gray-200/50 focus:border-green-500 rounded-lg px-3 bg-white"
                                >
                                  <SelectValue placeholder="Sélectionnez une matière" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-gray-200/50 shadow-lg backdrop-blur-xl bg-white/95">
                                  {matieres.map((matiere) => (
                                    <SelectItem key={matiere.id} value={matiere.id}>
                                      {matiere.nom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex-1 w-full space-y-1">
                              <Label htmlFor={`niveau-matiere-${index}`} className="text-sm text-gray-600">
                                Niveau de la matière
                              </Label>
                              <Select
                                onValueChange={(value) => {
                                  const updated = [...enseignantMatieresNiveaux]
                                  updated[index].niveauId = value
                                  setEnseignantMatieresNiveaux(updated)
                                }}
                                value={item.niveauId}
                              >
                                <SelectTrigger
                                  id={`niveau-matiere-${index}`}
                                  className="h-10 text-sm border-gray-200/50 focus:border-green-500 rounded-lg px-3 bg-white"
                                >
                                  <SelectValue placeholder="Sélectionnez un niveau" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-gray-200/50 shadow-lg backdrop-blur-xl bg-white/95">
                                  {niveaux.map((niveau) => (
                                    <SelectItem key={niveau.id} value={niveau.id}>
                                      {`${niveau.nom} (${niveau.departement.nom})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveMatiereNiveau(index)}
                              className="self-center sm:self-end h-10 px-3 py-2 text-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddMatiereNiveau}
                          className="mt-2 w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
                        >
                          Ajouter une Matière Enseignée
                        </Button>
                      </motion.div>
                    )}
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
                            {currentUser ? "Modification..." : "Création..."}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center relative z-10">
                            {currentUser ? (
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
                      Suppression de l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-red-100 text-lg mt-4">
                      Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible
                      et toutes les données liées (profils, séances, etc.) seront supprimées.
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
