"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  CalendarCheck,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  BookOpen,
  Shield,
  Zap,
  Users,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Enum pour les rôles (doit correspondre à Prisma)
enum Role {
  ADMIN = "ADMIN",
  ETUDIANT = "ETUDIANT",
  ENSEIGNANT = "ENSEIGNANT",
}

// Schéma de validation pour une matière/niveau enseigné (pour enseignant)
const matiereNiveauSchema = z.object({
  matiereId: z.string().min(1, "L'ID de la matière est requis.").uuid("L'ID de la matière doit être un UUID valide."),
  niveauId: z.string().min(1, "L'ID du niveau est requis.").uuid("L'ID du niveau doit être un UUID valide."),
})

// Schéma de validation principal avec validation conditionnelle pour les profils
const formSchema = z
  .object({
    nom: z.string().min(1, { message: "Le nom est requis." }),
    email: z.string().min(1, { message: "L'email est requis." }).email({ message: "L'email n'est pas valide." }),
    motDePasse: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
    confirmMotDePasse: z.string().min(6, { message: "La confirmation du mot de passe est requise." }),
    role: z.nativeEnum(Role),
    etudiantProfile: z
      .object({
        matricule: z.string().optional().nullable(),
        niveauId: z
          .string()
          .min(1, "Le niveau est requis pour l'étudiant.")
          .uuid("Le niveauId doit être un UUID valide.")
          .or(z.literal("")),
      })
      .optional(),
    enseignantProfile: z
      .object({
        poste: z.string().optional().nullable(),
        matieresNiveaux: z.array(matiereNiveauSchema).optional(),
      })
      .optional(),
  })
  .refine((data) => data.motDePasse === data.confirmMotDePasse, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmMotDePasse"],
  })
  .refine(
    (data) => {
      if (data.role === Role.ETUDIANT) {
        return data.etudiantProfile && data.etudiantProfile.niveauId && data.etudiantProfile.niveauId !== ""
      }
      if (data.role === Role.ENSEIGNANT) {
        return data.enseignantProfile
      }
      return true
    },
    {
      message: "Les informations de profil sont requises pour ce rôle.",
      path: ["role"],
    },
  )

type RegisterFormValues = z.infer<typeof formSchema>

interface Niveau {
  id: string
  nom: string
  departement: {
    id: string
    nom: string
  }
}

interface Matiere {
  id: string
  nom: string
  niveauId: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      email: "",
      motDePasse: "",
      confirmMotDePasse: "",
      role: Role.ETUDIANT,
      etudiantProfile: {
        niveauId: "",
        matricule: "",
      },
      enseignantProfile: {
        poste: "",
        matieresNiveaux: [],
      },
    },
  })

  const selectedRole = form.watch("role")
  const matieresNiveauxFields = form.watch("enseignantProfile.matieresNiveaux")

  // Charger les niveaux et matières depuis le backend
  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true)
      try {
        const niveauxRes = await fetch("http://localhost:3000/niveaux")
        const matieresRes = await fetch("http://localhost:3000/matieres")

        if (!niveauxRes.ok) {
          const errorData = await niveauxRes.json()
          throw new Error(`Échec de la récupération des niveaux : ${errorData.message || niveauxRes.statusText}`)
        }
        if (!matieresRes.ok) {
          const errorData = await matieresRes.json()
          throw new Error(`Échec de la récupération des matières : ${errorData.message || matieresRes.statusText}`)
        }

        // Parsez la réponse complète en JSON
        const niveauxResponse = await niveauxRes.json()
        const matieresResponse = await matieresRes.json()

        // Accédez à la propriété 'data' pour obtenir le tableau réel
        const niveauxData: Niveau[] = niveauxResponse.data
        const matieresData: Matiere[] = matieresResponse.data

        // Assurez-vous que les données extraites sont bien des tableaux avant de les définir
        if (!Array.isArray(niveauxData)) {
          throw new Error("Les données des niveaux ne sont pas un tableau.")
        }
        if (!Array.isArray(matieresData)) {
          throw new Error("Les données des matières ne sont pas un tableau.")
        }

        setNiveaux(niveauxData)
        setMatieres(matieresData)
      } catch (error: any) {
        console.error("Erreur lors du chargement des données:", error)
        setErrorMessage(`Impossible de charger les données (niveaux/matières) : ${error.message || "Erreur inconnue"}`)
        setNiveaux([])
        setMatieres([])
      } finally {
        setIsDataLoading(false)
      }
    }
    fetchData()
  }, [])

  const addMatiereNiveau = () => {
    const currentMatieresNiveaux = form.getValues("enseignantProfile.matieresNiveaux") || []
    form.setValue("enseignantProfile.matieresNiveaux", [...currentMatieresNiveaux, { matiereId: "", niveauId: "" }])
  }

  const removeMatiereNiveau = (index: number) => {
    const currentMatieresNiveaux = form.getValues("enseignantProfile.matieresNiveaux")
    if (currentMatieresNiveaux) {
      const newMatieresNiveaux = currentMatieresNiveaux.filter((_, i) => i !== index)
      form.setValue("enseignantProfile.matieresNiveaux", newMatieresNiveaux)
    }
  }

  async function onSubmit(values: RegisterFormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const { confirmMotDePasse, ...payload } = values

      if (payload.role === Role.ETUDIANT) {
        delete payload.enseignantProfile
        if (payload.etudiantProfile && payload.etudiantProfile.niveauId === "") {
          payload.etudiantProfile.niveauId = ""
        }
      } else if (payload.role === Role.ENSEIGNANT) {
        delete payload.etudiantProfile
        if (payload.enseignantProfile && payload.enseignantProfile.matieresNiveaux) {
          payload.enseignantProfile.matieresNiveaux = payload.enseignantProfile.matieresNiveaux.filter(
            (item) => item.matiereId && item.niveauId,
          )
        }
      } else {
        delete payload.etudiantProfile
        delete payload.enseignantProfile
      }

      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessageText = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Une erreur est survenue lors de l'inscription."
        setErrorMessage(errorMessageText)
        console.error("Erreur d'inscription:", data)
        return
      }

      setSuccessMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.")
      form.reset()
      router.push("/login")
    } catch (error) {
      console.error("Erreur réseau ou inattendue:", error)
      setErrorMessage("Impossible de se connecter au serveur. Veuillez réessayer plus tard.")
    } finally {
      setIsLoading(false)
    }
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

  const features = [
    {
      icon: Shield,
      title: "Sécurité Avancée",
      description: "Protection maximale de vos données avec chiffrement de bout en bout",
    },
    {
      icon: Zap,
      title: "Interface Rapide",
      description: "Accès instantané à toutes vos fonctionnalités d'emploi du temps",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Travaillez en équipe avec vos collègues et étudiants",
    },
  ]

  // Affiche un indicateur de chargement si les données sont toujours en cours de récupération
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-gray-600 font-medium">Chargement des données...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col">
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="flex max-w-6xl mx-auto gap-8 relative w-full">
          {/* Éléments décoratifs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-32 h-32 bg-blue-200/20 rounded-full -top-16 -left-16"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute w-24 h-24 bg-purple-200/25 rounded-full -bottom-12 -right-12"
              animate={{
                scale: [1, 0.8, 1],
                opacity: [0.25, 0.4, 0.25],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>

          {/* Section Gauche - Formulaire */}
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex-1">
            <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-transparent to-purple-600/8 rounded-2xl" />

              <CardHeader className="text-center pb-6 pt-6 relative">
                <motion.div
                  className="flex justify-center mb-4"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                    <CalendarCheck className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Rejoignez-nous !</CardTitle>
                  <CardDescription className="text-gray-600">
                    Créez votre compte pour commencer à gérer votre emploi du temps
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="px-6 pb-6 relative max-h-[65vh] overflow-y-auto">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Champs Nom et Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={itemVariants}>
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-semibold">Nom Complet</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Votre nom"
                                  {...field}
                                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="votre.email@example.com"
                                  {...field}
                                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </div>

                    {/* Champs Mot de Passe */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={itemVariants}>
                        <FormField
                          control={form.control}
                          name="motDePasse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-semibold">Mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...field}
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                                  >
                                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <FormField
                          control={form.control}
                          name="confirmMotDePasse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-semibold">Confirmer le mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...field}
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                                  >
                                    {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </div>

                    {/* Sélection du rôle */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700 font-semibold">Je suis un(e)</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value: Role) => {
                                  field.onChange(value)
                                  if (value === Role.ETUDIANT) {
                                    form.setValue("enseignantProfile", undefined)
                                  } else if (value === Role.ENSEIGNANT) {
                                    form.setValue("etudiantProfile", undefined)
                                  }
                                }}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors duration-200 cursor-pointer">
                                      <RadioGroupItem value={Role.ETUDIANT} />
                                      <div className="flex items-center space-x-2">
                                        <GraduationCap className="h-4 w-4 text-blue-600" />
                                        <FormLabel className="font-medium text-gray-800 cursor-pointer text-sm">
                                          Étudiant
                                        </FormLabel>
                                      </div>
                                    </div>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-xl p-3 hover:border-purple-300 transition-colors duration-200 cursor-pointer">
                                      <RadioGroupItem value={Role.ENSEIGNANT} />
                                      <div className="flex items-center space-x-2">
                                        <BookOpen className="h-4 w-4 text-purple-600" />
                                        <FormLabel className="font-medium text-gray-800 cursor-pointer text-sm">
                                          Enseignant
                                        </FormLabel>
                                      </div>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Champs spécifiques à l'Étudiant */}
                    <AnimatePresence>
                      {selectedRole === Role.ETUDIANT && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-200/50"
                        >
                          <div className="flex items-center space-x-2 mb-3">
                            <User className="h-4 w-4 text-blue-600" />
                            <h3 className="text-base font-semibold text-blue-800">Profil Étudiant</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="etudiantProfile.matricule"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-semibold text-sm">
                                    Matricule (Optionnel)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Votre matricule étudiant"
                                      {...field}
                                      value={field.value ?? ""}
                                      className="h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="etudiantProfile.niveauId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-semibold text-sm">Niveau</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 rounded-xl shadow-sm bg-white/80">
                                        <SelectValue placeholder="Sélectionnez votre niveau" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white">
                                      {Array.isArray(niveaux) &&
                                        niveaux.map((niveau) => (
                                          <SelectItem key={niveau.id} value={niveau.id}>
                                            {`${niveau.nom} (${niveau.departement.nom})`}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Champs spécifiques à l'Enseignant */}
                    <AnimatePresence>
                      {selectedRole === Role.ENSEIGNANT && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 bg-purple-50/50 p-4 rounded-xl border border-purple-200/50"
                        >
                          <div className="flex items-center space-x-2 mb-3">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                            <h3 className="text-base font-semibold text-purple-800">Profil Enseignant</h3>
                          </div>

                          <FormField
                            control={form.control}
                            name="enseignantProfile.poste"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-semibold text-sm">Poste (Optionnel)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Professeur de mathématiques"
                                    {...field}
                                    value={field.value ?? ""}
                                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-3">
                            <Label className="text-gray-700 font-semibold text-sm">
                              Matières Enseignées (Optionnel)
                            </Label>
                            {matieresNiveauxFields?.map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-2 items-end p-3 bg-white/60 rounded-lg border border-purple-200/50"
                              >
                                <FormField
                                  control={form.control}
                                  name={`enseignantProfile.matieresNiveaux.${index}.matiereId`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-9 border-gray-300 focus:border-purple-500 rounded-lg text-sm">
                                            <SelectValue placeholder="Matière" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                          {Array.isArray(matieres) &&
                                            matieres.map((matiere) => (
                                              <SelectItem key={matiere.id} value={matiere.id}>
                                                {matiere.nom}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`enseignantProfile.matieresNiveaux.${index}.niveauId`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-9 border-gray-300 focus:border-purple-500 rounded-lg text-sm">
                                            <SelectValue placeholder="Niveau" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                          {Array.isArray(niveaux) &&
                                            niveaux.map((niveau) => (
                                              <SelectItem key={niveau.id} value={niveau.id}>
                                                {`${niveau.nom} (${niveau.departement.nom})`}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMatiereNiveau(index)}
                                  className="h-9 px-2 border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addMatiereNiveau}
                              className="w-full border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 cursor-pointer text-sm bg-transparent"
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Ajouter une Matière
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Messages */}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm"
                      >
                        <span className="block sm:inline text-sm">{errorMessage}</span>
                      </motion.div>
                    )}
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-sm"
                      >
                        <span className="block sm:inline text-sm">{successMessage}</span>
                      </motion.div>
                    )}

                    {/* Bouton de soumission */}
                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] relative overflow-hidden cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inscription en cours...
                          </>
                        ) : (
                          <>
                            Créer mon compte
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                {/* Liens supplémentaires */}
                <motion.div variants={itemVariants} className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Déjà un compte ?{" "}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200 cursor-pointer"
                    >
                      Se connecter
                    </Link>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Droite - Présentation */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex-1 hidden lg:block"
          >
            <Card className="h-[600px] shadow-2xl rounded-2xl border-0 bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.04%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60"></div>

              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-white" style={{ top: `${20 + i * 12}%` }} />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-white" style={{ left: `${20 + i * 15}%` }} />
                ))}
              </div>

              <CardContent className="p-6 h-full flex flex-col justify-center relative z-10">
                <motion.div variants={itemVariants} className="text-white mb-6">
                  <h2 className="text-2xl font-bold mb-3">Commencez votre parcours avec nous</h2>
                  <p className="text-lg text-purple-100 leading-relaxed">
                    Rejoignez des milliers d'utilisateurs qui font confiance à notre plateforme pour gérer leur emploi
                    du temps.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="flex items-start space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
                        <p className="text-purple-100 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="p-4 bg-green-500/20 rounded-xl border border-green-400/30"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="font-semibold text-base text-white">Inscription gratuite</span>
                  </div>
                  <p className="text-green-100 text-sm">
                    Créez votre compte gratuitement et découvrez toutes nos fonctionnalités sans engagement.
                  </p>
                </motion.div>
              </CardContent>

              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute w-16 h-16 bg-white/5 rounded-full"
                  style={{ top: "15%", right: "10%" }}
                  animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute w-12 h-12 bg-purple-300/10 rounded-full"
                  style={{ bottom: "25%", left: "15%" }}
                  animate={{
                    y: [0, 10, 0],
                    x: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer avec Copyright */}
      <footer className="text-white py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} Votre Application d'Emploi du Temps. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
