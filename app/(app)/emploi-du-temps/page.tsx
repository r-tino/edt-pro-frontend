"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarCheck,
  Filter,
  Loader2,
  Clock,
  Building2,
  Ban,
  Lightbulb,
  RefreshCw,
  Search,
  Calendar,
  Grid3X3,
  CalendarDays,
  MapPin,
  User,
  BookOpen,
  GraduationCap,
  Eye,
  EyeOff,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

enum Jour {
  LUNDI = "LUNDI",
  MARDI = "MARDI",
  MERCREDI = "MERCREDI",
  JEUDI = "JEUDI",
  VENDREDI = "VENDREDI",
  SAMEDI = "SAMEDI",
  DIMANCHE = "DIMANCHE",
}

interface Utilisateur {
  id: string
  nom: string
  email: string
  role: Role
}

interface Departement {
  id: string
  nom: string
}

interface Niveau {
  id: string
  nom: string
  departement: Departement
}

interface Matiere {
  id: string
  nom: string
  niveau: Niveau
}

interface Salle {
  id: string
  nom: string
  type: string
  capacite: number
}

interface Seance {
  id: string
  niveauId: string
  enseignantId: string
  matiereId: string
  salleId: string
  date: string
  heureDebut: string
  heureFin: string
  anneeScolaire: string
  semestre: string | null
  niveau: {
    id: string
    nom: string
    departement: Departement
  }
  enseignant: {
    utilisateur: Utilisateur
  }
  matiere: {
    nom: string
    niveau: Niveau
  }
  salle: Salle
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

// Affiche le jour de la semaine à partir de la date
const getJourFromDate = (dateString: string): Jour => {
  const days: Jour[] = [Jour.DIMANCHE, Jour.LUNDI, Jour.MARDI, Jour.MERCREDI, Jour.JEUDI, Jour.VENDREDI, Jour.SAMEDI]
  const date = new Date(dateString)
  return days[date.getDay()]
}

// Formatage date courte (ex: 01/08/2025)
const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// Formatage date longue (ex: Lundi 01 Août 2025)
const formatDateLong = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// Pour l'entête des jours: dégradé foncé + texte blanc
const getDayHeaderBg = (jour: string) => {
  const colors = {
    LUNDI: "from-blue-500 to-blue-600",
    MARDI: "from-purple-500 to-purple-600",
    MERCREDI: "from-emerald-500 to-emerald-600",
    JEUDI: "from-teal-500 to-teal-600",
    VENDREDI: "from-indigo-500 to-indigo-600",
    SAMEDI: "from-cyan-500 to-cyan-600",
    DIMANCHE: "from-gray-400 to-gray-500",
  }
  return colors[jour as keyof typeof colors] || "from-gray-500 to-gray-600"
}

// Pour le contour de la carte séance
const getDayBorder = (jour: string) => {
  const borders = {
    LUNDI: "border-blue-400",
    MARDI: "border-purple-400",
    MERCREDI: "border-emerald-400",
    JEUDI: "border-teal-400",
    VENDREDI: "border-indigo-400",
    SAMEDI: "border-cyan-400",
    DIMANCHE: "border-gray-400",
  }
  return borders[jour as keyof typeof borders] || "border-gray-400"
}

// Pour le fond des cartes de séance
const bgCardColor = (jour: string) => {
  const colors = {
    LUNDI: "bg-blue-50/80",
    MARDI: "bg-purple-50/80",
    MERCREDI: "bg-emerald-50/80",
    JEUDI: "bg-teal-50/80",
    VENDREDI: "bg-indigo-50/80",
    SAMEDI: "bg-cyan-50/80",
    DIMANCHE: "bg-gray-50/80",
  }
  return colors[jour as keyof typeof colors] || "bg-gray-50/80"
}

// Pour les accents de couleur
const getDayAccent = (jour: string) => {
  const accents = {
    LUNDI: "text-blue-600",
    MARDI: "text-purple-600",
    MERCREDI: "text-emerald-600",
    JEUDI: "text-teal-600",
    VENDREDI: "text-indigo-600",
    SAMEDI: "text-cyan-600",
    DIMANCHE: "text-gray-600",
  }
  return accents[jour as keyof typeof accents] || "text-gray-600"
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false })
}

const creneauxHoraires = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

const joursOrdres = [Jour.LUNDI, Jour.MARDI, Jour.MERCREDI, Jour.JEUDI, Jour.VENDREDI, Jour.SAMEDI]

// Composant Modal pour les détails de la séance
const SeanceDetailsModal = ({
  seance,
  isOpen,
  onClose,
}: { seance: Seance | null; isOpen: boolean; onClose: () => void }) => {
  if (!seance) return null

  const jour = getJourFromDate(seance.date)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-3 bg-gradient-to-br ${getDayHeaderBg(jour)} rounded-xl shadow-lg`}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">{seance.matiere.nom}</div>
              <div className="text-sm text-gray-600 font-normal mt-1">Détails de la séance</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Informations principales */}
          <div className={`p-6 rounded-xl border-2 ${getDayBorder(jour)} ${bgCardColor(jour)} space-y-4`}>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informations principales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jour et Date */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-800">Jour</div>
                    <Badge
                      variant="secondary"
                      className={`${getDayAccent(jour)} bg-white/80 font-bold px-3 py-1 rounded-full`}
                    >
                      {jour}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-800">Date</div>
                    <div className="text-gray-700">{formatDateLong(seance.date)}</div>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-800">Horaires</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatTime(seance.heureDebut)} - {formatTime(seance.heureFin)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations académiques */}
          <div className="p-6 bg-gray-50 rounded-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Informations académiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-800">Matière</div>
                  <div className="text-gray-700 font-medium">{seance.matiere.nom}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="font-semibold text-gray-800">Niveau</div>
                  <div className="text-gray-700">{seance.niveau.nom}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-gray-800">Département</div>
                  <div className="text-gray-700">{seance.niveau.departement.nom}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-800">Enseignant</div>
                  <div className="text-gray-700">{seance.enseignant.utilisateur.nom}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations logistiques */}
          <div className="p-6 bg-blue-50 rounded-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informations logistiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-teal-600" />
                <div>
                  <div className="font-semibold text-gray-800">Salle</div>
                  <div className="text-gray-700 font-medium">{seance.salle.nom}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-semibold text-gray-800">Type de salle</div>
                  <div className="text-gray-700">{seance.salle.type}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-cyan-600" />
                <div>
                  <div className="font-semibold text-gray-800">Capacité</div>
                  <div className="text-gray-700">{seance.salle.capacite} places</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations administratives */}
          {(seance.anneeScolaire || seance.semestre) && (
            <div className="p-6 bg-yellow-50 rounded-xl space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informations administratives
              </h3>

              <div className="flex flex-wrap gap-3">
                {seance.anneeScolaire && (
                  <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 px-4 py-2 text-sm">
                    Année scolaire: {seance.anneeScolaire}
                  </Badge>
                )}
                {seance.semestre && (
                  <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 px-4 py-2 text-sm">
                    Semestre: {seance.semestre}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function EmploiDuTempsPage() {
  const [seances, setSeances] = useState<Seance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    niveauId: "",
    matiereId: "",
    salleId: "",
    anneeScolaire: "",
    semestre: "",
  })
  const [niveauxOptions, setNiveauxOptions] = useState<Niveau[]>([])
  const [matieresOptions, setMatieresOptions] = useState<Matiere[]>([])
  const [sallesOptions, setSallesOptions] = useState<Salle[]>([])

  const anneesScolairesOptions = ["2023-2024", "2024-2025", "2025-2026"]
  const semestresOptions = ["S1", "S2"]

  const handleSeanceClick = (seance: Seance) => {
    setSelectedSeance(seance)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedSeance(null)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        if (parsedUser.role === Role.ETUDIANT && parsedUser.etudiant?.niveauId) {
          setFilters((prev) => ({ ...prev, niveauId: parsedUser.etudiant.niveauId || "" }))
        }
      } catch (e) {
        localStorage.removeItem("user")
        localStorage.removeItem("accessToken")
        setUser(null)
      }
    }
    setInitialLoad(false)
  }, [])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) return

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      }

      try {
        const [niveauxRes, matieresRes, sallesRes] = await Promise.all([
          fetch("http://localhost:3000/api/niveaux", { headers }),
          fetch("http://localhost:3000/api/matieres", { headers }),
          fetch("http://localhost:3000/api/salles", { headers }),
        ])

        if (niveauxRes.ok) {
          const data = await niveauxRes.json()
          setNiveauxOptions(data.data || [])
        }
        if (matieresRes.ok) {
          const data = await matieresRes.json()
          setMatieresOptions(data.data || [])
        }
        if (sallesRes.ok) {
          const data = await sallesRes.json()
          setSallesOptions(data.data || [])
        }
      } catch (err) {
        setNiveauxOptions([])
        setMatieresOptions([])
        setSallesOptions([])
      }
    }
    fetchFilterOptions()
  }, [])

  const fetchSeances = useCallback(async () => {
    if (initialLoad) {
      setLoading(true)
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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      setError("La requête a expiré. Le serveur ne répond pas ou est très lent.")
      setLoading(false)
    }, 10000)

    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const apiUrl = `http://localhost:3000/api/seances?${queryParams.toString()}`

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Échec de la récupération des séances. Statut: ${response.status}`)
      }

      const result = await response.json()
      setSeances(result.data || [])
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name !== "AbortError") {
        setError(err.message || "Une erreur est survenue lors du chargement des emplois du temps.")
      }
      setSeances([])
    } finally {
      setLoading(false)
    }
  }, [filters, initialLoad])

  useEffect(() => {
    if (!initialLoad) {
      fetchSeances()
    }
  }, [fetchSeances, initialLoad])

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value === "null-filter" ? "" : value }))
  }

  const resetFilters = () => {
    setFilters((prev) => {
      if (user?.role === Role.ETUDIANT && user.etudiant?.niveauId) {
        return {
          niveauId: user.etudiant.niveauId,
          matiereId: "",
          salleId: "",
          anneeScolaire: "",
          semestre: "",
        }
      }
      return {
        niveauId: "",
        matiereId: "",
        salleId: "",
        anneeScolaire: "",
        semestre: "",
      }
    })
  }

  const isInCreneau = (heureDebutStr: string, creneauDebut: string, creneauFin: string) => {
    const [startH, startM] = creneauDebut.split(":").map(Number)
    const [endH, endM] = creneauFin.split(":").map(Number)
    const heure = new Date(heureDebutStr)
    const h = heure.getHours()
    const m = heure.getMinutes()
    const current = h * 60 + m
    const start = startH * 60 + startM
    const end = endH * 60 + endM
    return current >= start && current < end
  }

  const seancesParJour = seances.reduce(
    (acc, seance) => {
      const jour = getJourFromDate(seance.date)
      if (!acc[jour]) acc[jour] = []
      acc[jour].push(seance)
      return acc
    },
    {} as Record<string, Seance[]>,
  )

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")
  const totalSeances = seances.length

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-8"
        >
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <div className="p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl">
              <CalendarCheck className="h-20 w-20 text-white" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>
          <div className="text-center space-y-3">
            <motion.h2
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Initialisation de votre emploi du temps
            </motion.h2>
            <p className="text-gray-600 text-lg">Préparation de votre planning personnalisé...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Header amélioré avec statistiques */}
          <motion.div
            className="relative overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl">
                      <CalendarCheck className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Emploi du Temps
                    </h1>
                    <p className="text-gray-600 text-lg mt-1">Votre planning hebdomadaire personnalisé</p>
                    {user && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <User className="h-3 w-3 mr-1" />
                          {user.nom} ({user.role})
                        </Badge>
                        {totalSeances > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {totalSeances} séance{totalSeances !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Contrôles des filtres */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      onClick={() => setFiltersVisible(!filtersVisible)}
                      className={`border-2 transition-all duration-300 ${
                        filtersVisible
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      {filtersVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {filtersVisible ? "Masquer" : "Filtres"}
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 text-xs">
                          {Object.values(filters).filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>

                  {/* Sélecteur de vue amélioré */}
                  <div className="flex bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200">
                    <Button
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      onClick={() => setViewMode("calendar")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        viewMode === "calendar"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Grille
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      onClick={() => setViewMode("list")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        viewMode === "list"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Liste
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Filtres améliorée */}
          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-indigo-50/80 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg"
                          whileHover={{ rotate: 10, scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Filter className="h-5 w-5 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Filtres de recherche
                            {hasActiveFilters && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                {Object.values(filters).filter(Boolean).length} actif
                                {Object.values(filters).filter(Boolean).length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Personnalisez l'affichage de votre emploi du temps
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        disabled={!hasActiveFilters}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {/* Année Scolaire */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm" />
                          Année Scolaire
                        </Label>
                        <Select
                          onValueChange={(val) => handleFilterChange("anneeScolaire", val)}
                          value={filters.anneeScolaire}
                        >
                          <SelectTrigger className="h-11 text-sm hover:shadow-md transition-all duration-200 border-2 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
                            <SelectValue placeholder="Toutes les années" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null-filter">Toutes les années</SelectItem>
                            {anneesScolairesOptions.map((annee) => (
                              <SelectItem key={annee} value={annee}>
                                {annee}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Semestre */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-sm" />
                          Semestre
                        </Label>
                        <Select onValueChange={(val) => handleFilterChange("semestre", val)} value={filters.semestre}>
                          <SelectTrigger className="h-11 text-sm hover:shadow-md transition-all duration-200 border-2 hover:border-purple-300 bg-white/80 backdrop-blur-sm">
                            <SelectValue placeholder="Tous les semestres" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null-filter">Tous les semestres</SelectItem>
                            {semestresOptions.map((sem) => (
                              <SelectItem key={sem} value={sem}>
                                {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Niveau */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full shadow-sm" />
                          Niveau
                        </Label>
                        <Select onValueChange={(val) => handleFilterChange("niveauId", val)} value={filters.niveauId}>
                          <SelectTrigger className="h-11 text-sm hover:shadow-md transition-all duration-200 border-2 hover:border-indigo-300 bg-white/80 backdrop-blur-sm">
                            <SelectValue placeholder="Tous les niveaux" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null-filter">Tous les niveaux</SelectItem>
                            {niveauxOptions.map((niv) => (
                              <SelectItem key={niv.id} value={niv.id}>
                                {niv.nom} ({niv.departement.nom})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Matière */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-sm" />
                          Matière
                        </Label>
                        <Select onValueChange={(val) => handleFilterChange("matiereId", val)} value={filters.matiereId}>
                          <SelectTrigger className="h-11 text-sm hover:shadow-md transition-all duration-200 border-2 hover:border-teal-300 bg-white/80 backdrop-blur-sm">
                            <SelectValue placeholder="Toutes les matières" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null-filter">Toutes les matières</SelectItem>
                            {matieresOptions
                              .filter((matiere) => (filters.niveauId ? matiere.niveau.id === filters.niveauId : true))
                              .map((matiere) => (
                                <SelectItem key={matiere.id} value={matiere.id}>
                                  {matiere.nom}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Salle */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-sm" />
                          Salle
                        </Label>
                        <Select onValueChange={(val) => handleFilterChange("salleId", val)} value={filters.salleId}>
                          <SelectTrigger className="h-11 text-sm hover:shadow-md transition-all duration-200 border-2 hover:border-yellow-300 bg-white/80 backdrop-blur-sm">
                            <SelectValue placeholder="Toutes les salles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null-filter">Toutes les salles</SelectItem>
                            {sallesOptions.map((salle) => (
                              <SelectItem key={salle.id} value={salle.id}>
                                {salle.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contenu principal */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center p-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl"
              >
                <motion.div
                  className="relative mb-8"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div className="p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-2xl shadow-2xl">
                    <Loader2 className="h-12 w-12 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  />
                </motion.div>
                <motion.h3
                  className="text-2xl font-bold text-gray-800 mb-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  Chargement en cours...
                </motion.h3>
                <p className="text-gray-600 text-lg text-center max-w-md">
                  Récupération de votre emploi du temps personnalisé
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 shadow-xl"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="p-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-2xl mb-6"
                  >
                    <Ban className="h-12 w-12 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-red-800 mb-4">Erreur de chargement</h3>
                  <p className="text-red-700 text-lg mb-8 max-w-2xl leading-relaxed">{error}</p>
                  <Button
                    onClick={fetchSeances}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl px-8 py-3 text-lg rounded-xl"
                  >
                    <RefreshCw className="h-5 w-5 mr-3" />
                    Réessayer
                  </Button>
                </div>
              </motion.div>
            ) : seances.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 shadow-xl"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-2xl mb-6"
                  >
                    <Lightbulb className="h-12 w-12 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-yellow-800 mb-4">Aucune séance trouvée</h3>
                  <p className="text-yellow-700 text-lg mb-8 max-w-2xl leading-relaxed">
                    Aucune séance ne correspond à vos critères de recherche. Essayez d'ajuster vos filtres pour voir
                    plus de résultats.
                  </p>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 bg-white/80 backdrop-blur-sm px-8 py-3 text-lg rounded-xl"
                  >
                    <Search className="h-5 w-5 mr-3" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              </motion.div>
            ) : viewMode === "calendar" ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                        <Grid3X3 className="h-6 w-6 text-white" />
                      </div>
                      Planning Hebdomadaire
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                        {totalSeances} séance{totalSeances !== 1 ? "s" : ""} au total
                      </div>
                      {hasActiveFilters && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Filter className="h-3 w-3 mr-1" />
                          Filtré
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      {/* En-têtes des jours améliorés */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        <div className="p-4 text-center font-bold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl shadow-sm">
                          <Clock className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-sm">Heures</div>
                        </div>
                        {joursOrdres.map((jour, index) => (
                          <motion.div
                            key={jour}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 text-center font-bold text-white rounded-xl shadow-lg bg-gradient-to-br ${getDayHeaderBg(jour)} relative overflow-hidden`}
                          >
                            <div className="relative z-10">
                              <div className="text-lg font-bold">{jour}</div>
                              <div className="text-sm opacity-90 mt-1 flex items-center justify-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {seancesParJour[jour]?.length || 0} séance
                                {(seancesParJour[jour]?.length || 0) !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                          </motion.div>
                        ))}
                      </div>

                      {/* Grille horaire améliorée */}
                      <div className="space-y-2">
                        {creneauxHoraires.slice(0, -1).map((heure, index) => {
                          const heureFin = creneauxHoraires[index + 1]
                          return (
                            <motion.div
                              key={heure}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="grid grid-cols-7 gap-2 min-h-[85px]"
                            >
                              <div className="flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3 shadow-sm">
                                <div className="text-center">
                                  <div className="font-bold text-gray-800 text-sm">{heure}</div>
                                  <div className="text-xs text-gray-600 mt-1">{heureFin}</div>
                                  <div className="w-8 h-0.5 bg-gray-400 mx-auto mt-1 rounded" />
                                </div>
                              </div>

                              {joursOrdres.map((jour) => {
                                const seancesJour = seancesParJour[jour] || []
                                const seancesCreneau = seancesJour.filter((seance) =>
                                  isInCreneau(seance.heureDebut, heure, heureFin),
                                )

                                return (
                                  <div key={`${jour}-${heure}`} className="relative">
                                    {seancesCreneau.length > 0 ? (
                                      <div className="space-y-1">
                                        {seancesCreneau.map((seance, seanceIndex) => (
                                          <motion.div
                                            key={seance.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 300,
                                              delay: seanceIndex * 0.05,
                                            }}
                                            onClick={() => handleSeanceClick(seance)}
                                            className={`p-3 rounded-xl shadow-lg border-2 ${getDayBorder(jour)} ${bgCardColor(jour)} backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}
                                          >
                                            {/* Effet de survol */}
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

                                            <div className="relative z-10 space-y-2">
                                              {/* Jour et Date - ORDRE MODIFIÉ */}
                                              <div className="flex items-center gap-2 mb-2">
                                                <Badge
                                                  variant="secondary"
                                                  className={`${getDayAccent(getJourFromDate(seance.date))} bg-white/90 font-bold px-2 py-1 rounded-full text-xs`}
                                                >
                                                  {getJourFromDate(seance.date)}
                                                </Badge>
                                                <Badge
                                                  variant="secondary"
                                                  className="bg-pink-100 text-pink-800 font-bold px-2 py-1 rounded-full flex items-center text-xs"
                                                >
                                                  <CalendarDays className="h-3 w-3 mr-1" />
                                                  {formatDateShort(seance.date)}
                                                </Badge>
                                              </div>

                                              {/* Matière - Tronquée pour éviter le débordement */}
                                              <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                <div
                                                  className="font-bold text-sm text-gray-900 truncate"
                                                  title={seance.matiere.nom}
                                                >
                                                  {seance.matiere.nom}
                                                </div>
                                              </div>

                                              {/* Horaires */}
                                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                <span className="font-semibold">
                                                  {formatTime(seance.heureDebut)} - {formatTime(seance.heureFin)}
                                                </span>
                                              </div>

                                              {/* Salle */}
                                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{seance.salle.nom}</span>
                                              </div>

                                              {/* Indicateur pour plus d'infos */}
                                              <div className="text-xs text-gray-500 italic text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                Cliquer pour plus d'infos
                                              </div>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="h-full bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-100/50 transition-colors duration-200 group">
                                        <span className="text-gray-400 text-xs font-medium group-hover:text-gray-500">
                                          Libre
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    Vue Liste
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                      {totalSeances} séance{totalSeances !== 1 ? "s" : ""} trouvée{totalSeances !== 1 ? "s" : ""}
                    </div>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Filter className="h-3 w-3 mr-1" />
                        Filtré
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seances.map((seance, index) => (
                    <motion.div
                      key={seance.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group"
                    >
                      <Card
                        className={`h-full shadow-lg border-2 ${getDayBorder(getJourFromDate(seance.date))} ${bgCardColor(getJourFromDate(seance.date))} overflow-hidden hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative cursor-pointer`}
                        onClick={() => handleSeanceClick(seance)}
                      >
                        {/* Effet de survol */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <CardHeader className="pb-4 relative z-10">
                          <div className="space-y-3">
                            {/* Jour et Date - ORDRE MODIFIÉ */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={`${getDayAccent(getJourFromDate(seance.date))} bg-white/90 font-bold px-3 py-1 rounded-full text-xs`}
                                >
                                  {getJourFromDate(seance.date)}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-pink-100 text-pink-800 font-bold px-2 py-1 rounded-full flex items-center text-xs"
                                >
                                  <CalendarDays className="h-3 w-3 mr-1" />
                                  {formatDateShort(seance.date)}
                                </Badge>
                              </div>
                            </div>

                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-gray-600" />
                              {seance.matiere.nom}
                            </CardTitle>

                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold text-lg">
                                {formatTime(seance.heureDebut)} - {formatTime(seance.heureFin)}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Building2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Salle {seance.salle.nom}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <User className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">{seance.enseignant.utilisateur.nom}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {seance.niveau.nom} - {seance.niveau.departement.nom}
                                </span>
                              </div>
                            </div>

                            {(seance.anneeScolaire || seance.semestre) && (
                              <div className="flex gap-2 pt-2">
                                {seance.anneeScolaire && (
                                  <Badge variant="outline" className="text-xs bg-white/60">
                                    {seance.anneeScolaire}
                                  </Badge>
                                )}
                                {seance.semestre && (
                                  <Badge variant="outline" className="text-xs bg-white/60">
                                    {seance.semestre}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Indicateur pour plus d'infos */}
                            <div className="text-xs text-gray-500 italic text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Cliquer pour voir tous les détails
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal des détails de séance */}
          <SeanceDetailsModal seance={selectedSeance} isOpen={modalOpen} onClose={closeModal} />
        </motion.div>
      </div>
    </div>
  )
}
