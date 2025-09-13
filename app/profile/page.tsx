"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AppHeader } from "@/components/app-header"
import {
  Camera,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Building2,
  X,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

interface Niveau {
  id: string
  nom: string
  departement: { id: string; nom: string }
}

interface Matiere {
  id: string
  nom: string
  niveauId: string
  niveau: Niveau
}

interface Utilisateur {
  id: string
  nom: string
  email: string
  role: Role
  photoUrl?: string
  enseignant?: {
    id: string
    poste?: string | null
    matieres: { matiereId: string; matiere: Matiere }[]
  }
  etudiant?: {
    id: string
    matricule?: string | null
    niveauId?: string
    niveau?: Niveau
  }
}

interface UserInfo {
  id: string
  nom: string
  email: string
  role: Role
  photoUrl?: string
}

type FormDataType = {
  nom: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  photoFile: File | null
  photoUrl: string
  poste: string
  selectedMatieres: { matiereId: string; niveauId: string }[]
  matricule: string
  niveauId: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [userDetails, setUserDetails] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string>("")

  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])

  const [formData, setFormData] = useState<FormDataType>({
    nom: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    photoFile: null,
    photoUrl: "",
    poste: "",
    selectedMatieres: [],
    matricule: "",
    niveauId: "",
  })

  // Auth Check
  useEffect(() => {
    const userInfo = localStorage.getItem("user")
    const accessToken = localStorage.getItem("accessToken")
    if (!userInfo || !accessToken) {
      router.push("/login")
      return
    }
    try {
      setUser(JSON.parse(userInfo))
    } catch {
      router.push("/login")
    }
  }, [router])

  // Fetch Data Functions
  const fetchNiveaux = useCallback(
    async (accessToken: string) => {
      try {
        const response = await fetch(`${API_URL}/api/niveaux`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("user")
          localStorage.removeItem("accessToken")
          router.push("/login")
          return
        }

        if (!response.ok) throw new Error("Échec de la récupération des niveaux")

        const result = await response.json()
        setNiveaux(result.data || result)
      } catch (err: any) {
        console.error("Erreur niveaux:", err)
        toast.error("Impossible de charger les niveaux")
      }
    },
    [router],
  )

  const fetchMatieres = useCallback(
    async (accessToken: string) => {
      try {
        const response = await fetch(`${API_URL}/api/matieres`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("user")
          localStorage.removeItem("accessToken")
          router.push("/login")
          return
        }

        if (!response.ok) throw new Error("Échec de la récupération des matières")

        const result = await response.json()
        setMatieres(result.data || result)
      } catch (err: any) {
        console.error("Erreur matières:", err)
        toast.error("Impossible de charger les matières")
      }
    },
    [router],
  )

  const fetchUserDetails = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      setError("Token d'authentification manquant. Veuillez vous reconnecter.")
      setLoading(false)
      // Rediriger vers la page de connexion
      router.push("/login")
      return
    }

    await Promise.all([fetchNiveaux(accessToken), fetchMatieres(accessToken)])

    try {
      const response = await fetch(`${API_URL}/api/utilisateurs/${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem("user")
        localStorage.removeItem("accessToken")
        toast.error("Session expirée. Veuillez vous reconnecter.")
        router.push("/login")
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la récupération du profil.")
      }

      const result = await response.json()
      const u = result.data || result

      setUserDetails(u)
      setFormData({
        nom: u.nom || "",
        email: u.email || "",
        // Garder l'URL telle qu'elle est stockée en base
        photoUrl: u.photoUrl || "",
        photoFile: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        poste: u.enseignant?.poste || "",
        selectedMatieres:
          u.enseignant?.matieres?.map((m: any) => ({
            matiereId: m.matiereId,
            niveauId: m.matiere?.niveauId || "",
          })) || [],
        matricule: u.etudiant?.matricule || "",
        niveauId: u.etudiant?.niveauId || "",
      })
    } catch (err: any) {
      console.error("Erreur profil:", err)
      setError(err.message || "Impossible de charger le profil.")
    } finally {
      setLoading(false)
    }
  }, [user, fetchNiveaux, fetchMatieres, router])

  useEffect(() => {
    if (user) fetchUserDetails()
  }, [user, fetchUserDetails])

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.nom.trim()) errors.nom = "Le nom est requis"
    if (!formData.email.trim()) errors.email = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Email invalide"

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) errors.newPassword = "Minimum 6 caractères"
      if (!formData.currentPassword) errors.currentPassword = "Mot de passe actuel requis"
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Photo Upload
  const handlePhotoChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide")
      return
    }

    setFormData((prev) => ({
      ...prev,
      photoFile: file,
      photoUrl: URL.createObjectURL(file),
    }))
  }

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("")
    setFormErrors({})

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    if (!user) {
      toast.error("Utilisateur non connecté")
      return
    }

    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      toast.error("Token d'authentification manquant")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()

      // Ajouter les champs de base
      payload.append("nom", formData.nom)
      payload.append("email", formData.email)

      // Mot de passe (seulement si nouveau mot de passe fourni)
      if (formData.newPassword) {
        payload.append("currentPassword", formData.currentPassword)
        payload.append("newPassword", formData.newPassword)
      }

      // Photo
      if (formData.photoFile) {
        payload.append("photo", formData.photoFile)
      }

      // Champs spécifiques selon le rôle
      if (userDetails?.role === Role.ETUDIANT) {
        if (formData.matricule) payload.append("matricule", formData.matricule)
        if (formData.niveauId) payload.append("niveauId", formData.niveauId)
      }

      if (userDetails?.role === Role.ENSEIGNANT) {
        if (formData.poste) payload.append("poste", formData.poste)
        if (formData.selectedMatieres.length > 0) {
          payload.append("selectedMatieres", JSON.stringify(formData.selectedMatieres))
        }
      }

      const response = await fetch(`${API_URL}/api/utilisateurs/${user.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      })

      if (response.status === 401) {
        localStorage.removeItem("user")
        localStorage.removeItem("accessToken")
        toast.error("Session expirée. Veuillez vous reconnecter.")
        router.push("/login")
        return
      }

      const result = await response.json()

      if (!response.ok) {
        if (Array.isArray(result.message)) {
          throw new Error(result.message.join(" | "))
        }
        throw new Error(result.message || "Erreur lors de la mise à jour")
      }

      // Mise à jour des données locales
      const updatedUser = { ...user, ...result }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setSuccessMessage("Profil mis à jour avec succès !")
      toast.success("Profil mis à jour avec succès !")

      // Réinitialiser les champs de mot de passe
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err: any) {
      console.error("Erreur mise à jour:", err)
      toast.error(err.message || "Erreur lors de la mise à jour")
      setFormErrors({ submit: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
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

  // Fonction helper pour construire l'URL complète de l'image
  const getImageUrl = (photoUrl: string) => {
    // Si pas de photoUrl, utiliser une icône par défaut
    if (!photoUrl) {
      return "/default-avatar.png"
    }

    // Si c'est un blob URL (fichier temporaire), le retourner tel quel
    if (photoUrl.startsWith("blob:")) {
      return photoUrl
    }

    // Si l'URL est déjà complète (http/https), la retourner telle quelle
    if (photoUrl.startsWith("http")) {
      return photoUrl
    }

    // Si l'URL commence par uploads/ ou /uploads/, construire l'URL complète
    if (photoUrl.startsWith("uploads/") || photoUrl.startsWith("/uploads/")) {
      const cleanPath = photoUrl.startsWith("/") ? photoUrl.slice(1) : photoUrl
      return `${API_URL}/${cleanPath}`
    }

    // Par défaut, construire l'URL complète
    return `${API_URL}/${photoUrl}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg"
          >
            <Loader2 className="h-8 w-8 text-white" />
          </motion.div>
          <p className="text-gray-600 font-medium">Chargement de votre profil...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="p-4 bg-red-100 rounded-2xl mb-4 inline-block">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 cursor-pointer">
            Réessayer
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <AppHeader user={user || { id: "", nom: "", email: "", role: Role.ETUDIANT }} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto">
          {/* Header avec titre */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Mon Profil
            </h1>
            <p className="text-gray-600">Gérez vos informations personnelles et préférences</p>
          </motion.div>

          {/* Message de succès */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">{successMessage}</span>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="ml-auto text-green-600 hover:text-green-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar avec photo et infos */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* Photo de profil */}
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <img
                        src={getImageUrl(formData.photoUrl) || "/default-avatar.png"}
                        alt="Photo de profil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => document.getElementById("photoInput")?.click()}
                        onError={(e) => {
                          // Éviter la boucle infinie en ne changeant l'URL qu'une seule fois
                          if (e.currentTarget.src !== "/default-avatar.png") {
                            console.log("Erreur de chargement d'image:", formData.photoUrl)
                            e.currentTarget.src = "/default-avatar.png"
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <input
                      id="photoInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoChange(file)
                      }}
                    />

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{userDetails?.nom}</h3>
                    <p className="text-gray-600 mb-3">{userDetails?.email}</p>

                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 rounded-full font-medium ${
                        userDetails?.role === Role.ADMIN
                          ? "bg-red-100 text-red-800"
                          : userDetails?.role === Role.ENSEIGNANT
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {userDetails?.role === Role.ADMIN && "Administrateur"}
                      {userDetails?.role === Role.ENSEIGNANT && "Enseignant"}
                      {userDetails?.role === Role.ETUDIANT && "Étudiant"}
                    </Badge>
                  </div>

                  {/* Informations supplémentaires */}
                  {userDetails?.role === Role.ETUDIANT && userDetails.etudiant && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Niveau</p>
                          <p className="text-sm text-gray-600">{userDetails.etudiant.niveau?.nom || "Non défini"}</p>
                        </div>
                      </div>
                      {userDetails.etudiant.matricule && (
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Matricule</p>
                            <p className="text-sm text-gray-600">{userDetails.etudiant.matricule}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {userDetails?.role === Role.ENSEIGNANT && userDetails.enseignant && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      {userDetails.enseignant.poste && (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Poste</p>
                            <p className="text-sm text-gray-600">{userDetails.enseignant.poste}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-4 w-4 text-orange-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Matières</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userDetails.enseignant.matieres?.map((m) => (
                              <Badge key={m.matiereId} variant="outline" className="text-xs">
                                {m.matiere.nom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Formulaire principal */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Modifier mes informations
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Mettez à jour vos informations personnelles et de sécurité
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations de base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Nom complet
                        </Label>
                        <Input
                          value={formData.nom}
                          onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                          className={`h-11 transition-all duration-200 ${
                            formErrors.nom
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="Votre nom complet"
                        />
                        {formErrors.nom && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.nom}
                          </motion.p>
                        )}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Label className="text-gray-700 font-semibold flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          Adresse email
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          className={`h-11 transition-all duration-200 ${
                            formErrors.email
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="votre.email@example.com"
                        />
                        {formErrors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.email}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>

                    {/* Section mot de passe */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="border-t border-gray-100 pt-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-600" />
                        Changer le mot de passe
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-gray-700 font-medium mb-2 block">Mot de passe actuel</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                              className={`h-11 pr-10 ${
                                formErrors.currentPassword ? "border-red-500" : "border-gray-300"
                              }`}
                              placeholder="Mot de passe actuel"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {formErrors.currentPassword && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.currentPassword}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-700 font-medium mb-2 block">Nouveau mot de passe</Label>
                          <Input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className={`h-11 ${formErrors.newPassword ? "border-red-500" : "border-gray-300"}`}
                            placeholder="Nouveau mot de passe"
                          />
                          {formErrors.newPassword && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.newPassword}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-700 font-medium mb-2 block">Confirmer le mot de passe</Label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                              className={`h-11 pr-10 ${
                                formErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                              }`}
                              placeholder="Confirmer le mot de passe"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {formErrors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Champs spécifiques selon le rôle */}
                    {userDetails?.role === Role.ETUDIANT && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="border-t border-gray-100 pt-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-green-600" />
                          Informations étudiant
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-700 font-medium mb-2 block">Matricule</Label>
                            <Input
                              value={formData.matricule}
                              onChange={(e) => setFormData((prev) => ({ ...prev, matricule: e.target.value }))}
                              className="h-11"
                              placeholder="Votre matricule"
                            />
                          </div>

                          <div>
                            <Label className="text-gray-700 font-medium mb-2 block">Niveau</Label>
                            <Select
                              value={formData.niveauId}
                              onValueChange={(value) => setFormData((prev) => ({ ...prev, niveauId: value }))}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Sélectionner un niveau" />
                              </SelectTrigger>
                              <SelectContent>
                                {niveaux.map((niveau) => (
                                  <SelectItem key={niveau.id} value={niveau.id}>
                                    {niveau.nom} - {niveau.departement.nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {userDetails?.role === Role.ENSEIGNANT && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="border-t border-gray-100 pt-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-purple-600" />
                          Informations enseignant
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-700 font-medium mb-2 block">Poste</Label>
                            <Input
                              value={formData.poste}
                              onChange={(e) => setFormData((prev) => ({ ...prev, poste: e.target.value }))}
                              className="h-11"
                              placeholder="Votre poste"
                            />
                          </div>

                          <div>
                            <Label className="text-gray-700 font-medium mb-2 block">Matières enseignées</Label>
                            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                              {formData.selectedMatieres.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {formData.selectedMatieres.map((m) => {
                                    const matiere = matieres.find((mat) => mat.id === m.matiereId)
                                    return (
                                      <Badge key={m.matiereId} variant="secondary" className="px-3 py-1">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {matiere?.nom}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">Aucune matière assignée</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Bouton de soumission */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="pt-6"
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Mise à jour en cours...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            Enregistrer les modifications
                          </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </Button>
                    </motion.div>

                    {/* Erreur de soumission */}
                    {formErrors.submit && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                      >
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-800">{formErrors.submit}</span>
                      </motion.div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
