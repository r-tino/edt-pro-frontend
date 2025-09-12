"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Info,
  Filter,
  X,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


// ------------------------------------------------------
// AJOUT : Fonction de détection de conflit en haut du fichier
// ------------------------------------------------------
function detectSeanceConflicts(
  nouvelleSeance: {
    salleId: string;
    enseignantId: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    anneeScolaire?: string;
    semestre?: string | null;
  },
  seances: any[],
  editId?: string // optionnel en cas d'édition
) {
  let salle = null;
  let enseignant = null;
  let anyConflict = false;

  for (const seance of seances) {
    if (editId && seance.id === editId) continue;
    if (seance.date !== nouvelleSeance.date) continue;
    if (
      (nouvelleSeance.anneeScolaire && seance.anneeScolaire && seance.anneeScolaire !== nouvelleSeance.anneeScolaire) ||
      (nouvelleSeance.semestre && seance.semestre && seance.semestre !== nouvelleSeance.semestre)
    )
      continue;

    const debutN = nouvelleSeance.heureDebut;
    const finN = nouvelleSeance.heureFin;
    const debutS = seance.heureDebut;
    const finS = seance.heureFin;

    // Chevauchement d'horaires
    const chevauchement = debutN < finS && finN > debutS;

    if (chevauchement) {
      if (seance.salleId === nouvelleSeance.salleId) {
        salle = `Salle occupée par ${seance.matiere.nom} avec ${seance.enseignant.utilisateur.nom} de ${debutS} à ${finS}`;
        anyConflict = true;
      }
      if (seance.enseignantId === nouvelleSeance.enseignantId) {
        enseignant = `Enseignant indisponible (déjà en ${seance.salle.nom} pour ${seance.matiere.nom} de ${debutS} à ${finS})`;
        anyConflict = true;
      }
    }
  }

  return { salle, enseignant, anyConflict };
}

enum Role {
  ADMIN = "ADMIN",
  ENSEIGNANT = "ENSEIGNANT",
  ETUDIANT = "ETUDIANT",
}

interface Niveau {
  id: string;
  nom: string;
  departement: {
    id: string;
    nom: string;
  };
}

interface EnseignantOption {
  id: string;
  nom: string;
}

interface Matiere {
  id: string;
  nom: string;
  niveau: {
    id: string;
    nom: string;
  };
}

interface Salle {
  id: string;
  nom: string;
  capacite: number;
}

interface EnseignantMatiereRelation {
  enseignantId: string;
  matiereId: string;
}

interface Seance {
  id: string;
  niveauId: string;
  enseignantId: string;
  matiereId: string;
  salleId: string;
  date: string; // YYYY-MM-DD
  heureDebut: string;
  heureFin: string;
  anneeScolaire: string;
  semestre: string | null;
  niveau: { id: string; nom: string; departement: { id: string; nom: string } };
  enseignant: { id: string; utilisateur: { id: string; nom: string } };
  matiere: { id: string; nom: string; niveau: { id: string; nom: string } };
  salle: { id: string; nom: string; capacite: number };
}

// ZOD : SUPPRIMER jour
const seanceSchemaBaseObject = z.object({
  niveauId: z
    .string()
    .min(1, "Le niveau est requis.")
    .uuid("ID de niveau invalide."),
  enseignantId: z
    .string()
    .min(1, "L'enseignant est requis.")
    .uuid("ID d'enseignant invalide."),
  matiereId: z
    .string()
    .min(1, "La matière est requise.")
    .uuid("ID de matière invalide."),
  salleId: z
    .string()
    .min(1, "La salle est requise.")
    .uuid("ID de salle invalide."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date est requise au format YYYY-MM-DD."),
  heureDebut: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Format d'heure de début invalide (HH:MM)."
    ),
  heureFin: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Format d'heure de fin invalide (HH:MM)."
    ),
  anneeScolaire: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Format de l'année scolaire invalide (YYYY-YYYY)."),
  semestre: z.string().nullable().optional(),
});

const seanceSchemaBase = seanceSchemaBaseObject.refine(
  (data) => {
    const [h1, m1] = data.heureDebut.split(":").map(Number);
    const [h2, m2] = data.heureFin.split(":").map(Number);
    const debut = h1 * 60 + m1;
    const fin = h2 * 60 + m2;
    return fin > debut;
  },
  {
    message: "L'heure de fin doit être postérieure à l'heure de début.",
    path: ["heureFin"],
  }
);

const createSeanceSchema = seanceSchemaBase;
const updateSeanceSchema = seanceSchemaBaseObject.partial().refine(
  (data) => {
    if (!data.heureDebut || !data.heureFin) return true;
    const [h1, m1] = data.heureDebut.split(":").map(Number);
    const [h2, m2] = data.heureFin.split(":").map(Number);
    const debut = h1 * 60 + m1;
    const fin = h2 * 60 + m2;
    return fin > debut;
  },
  {
    message: "L'heure de fin doit être postérieure à l'heure de début.",
    path: ["heureFin"],
  }
);

type CreateFormValues = z.infer<typeof createSeanceSchema>;
type UpdateFormValues = z.infer<typeof updateSeanceSchema>;

// Affichage de la date au format JJ/MM/AAAA
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
};

const formatTime = (dateString: string): string => {
  if (!dateString) return "";
  // Si c'est déjà au format HH:MM
  if (/^\d{2}:\d{2}$/.test(dateString)) return dateString;
  // Sinon, on parse
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateAnneeScolaireOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(`${i}-${i + 1}`);
  }
  return years;
};

const anneeScolaireOptions = generateAnneeScolaireOptions();
const semestreOptions = ["S1", "S2"];

export default function AdminSeancesPage() {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [niveauxOptions, setNiveauxOptions] = useState<Niveau[]>([]);
  const [enseignantsOptions, setEnseignantsOptions] = useState<
    EnseignantOption[]
  >([]);
  const [matieresOptions, setMatieresOptions] = useState<Matiere[]>([]);
  const [sallesOptions, setSallesOptions] = useState<Salle[]>([]);
  const [enseignantMatiereRelations, setEnseignantMatiereRelations] = useState<
    EnseignantMatiereRelation[]
  >([]);

  const [filteredMatieresForForm, setFilteredMatieresForForm] = useState<
    Matiere[]
  >([]);
  const [filteredEnseignantsForForm, setFilteredEnseignantsForForm] = useState<
    EnseignantOption[]
  >([]);

  // SUPPRIMER jour du state des filtres
  const [filters, setFilters] = useState<any>({
    niveauId: "all",
    enseignantId: "all",
    matiereId: "all",
    salleId: "all",
    // date: "all",
    anneeScolaire: "all",
    semestre: "all",
  });

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSeanceSchema),
    defaultValues: {
      niveauId: "",
      enseignantId: "",
      matiereId: "",
      salleId: "",
      date: "",
      heureDebut: "08:00",
      heureFin: "10:00",
      anneeScolaire: anneeScolaireOptions[anneeScolaireOptions.length - 6],
      semestre: null,
    },
  });

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSeanceSchema),
    defaultValues: {
      niveauId: "",
      enseignantId: "",
      matiereId: "",
      salleId: "",
      date: "",
      heureDebut: "",
      heureFin: "",
      anneeScolaire: "",
      semestre: "",
    },
  });

  // --- WATCHED VALUES (pour désactiver dynamiquement les selects) ---
  const watchedNiveauId = createForm.watch("niveauId");
  const watchedMatiereId = createForm.watch("matiereId");
  const watchedNiveauIdEdit = editForm.watch("niveauId");
  const watchedMatiereIdEdit = editForm.watch("matiereId");

  // Fetch data for dropdowns (niveaux, enseignants, matieres, salles, enseignant-matieres relations)
  const fetchFormOptions = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("Token d'authentification manquant. Veuillez vous reconnecter.");
      return;
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    try {
      const [
        niveauxRes,
        utilisateursRes,
        matieresRes,
        sallesRes,
        relationsRes,
      ] = await Promise.all([
        fetch("http://localhost:3000/api/niveaux", { headers }),
        fetch("http://localhost:3000/api/utilisateurs?role=ENSEIGNANT", {
          headers,
        }),
        fetch("http://localhost:3000/api/matieres", { headers }),
        fetch("http://localhost:3000/api/salles", { headers }),
        fetch("http://localhost:3000/api/enseignant-matiere", { headers }),
      ]);

      const niveauxData = await niveauxRes.json();
      const utilisateursData = await utilisateursRes.json();
      const matieresData = await matieresRes.json();
      const sallesData = await sallesRes.json();
      const relationsData = await relationsRes.json();

      if (niveauxRes.ok) setNiveauxOptions(niveauxData.data || []);
      else console.error("Failed to fetch niveaux:", niveauxData.message);

      if (utilisateursRes.ok) {
        const usersArray = utilisateursData.data || utilisateursData || [];
        if (Array.isArray(usersArray)) {
          const teachers = usersArray
            .filter((u: any) => u.role === Role.ENSEIGNANT && u.enseignant)
            .map((u: any) => ({
              id: u.enseignant.id,
              nom: u.nom,
            }));
          setEnseignantsOptions(teachers || []);
        } else {
          console.error("Users data is not an array:", usersArray);
          setEnseignantsOptions([]);
        }
      } else
        console.error("Failed to fetch enseignants:", utilisateursData.message);

      if (matieresRes.ok) setMatieresOptions(matieresData.data || []);
      else console.error("Failed to fetch matieres:", matieresData.message);

      if (sallesRes.ok) setSallesOptions(sallesData.data || []);
      else console.error("Failed to fetch salles:", sallesData.message);

      if (relationsRes.ok)
        setEnseignantMatiereRelations(relationsData.data || []);
      else console.error("Failed to fetch relations:", relationsData.message);
    } catch (err) {
      console.error("Error fetching form options:", err);
      toast.error("Erreur lors du chargement des options de formulaire.");
    }
  }, []);

  // Fetch seances from backend with filters
  const fetchSeances = useCallback(async () => {
    setLoading(true);
    setError(null);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("Token d'authentification manquant. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        queryParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(
        `http://localhost:3000/api/seances?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Échec de la récupération des séances."
        );
      }

      setSeances(data.data || []);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des séances:", err);
      setError(
        err.message || "Une erreur est survenue lors du chargement des séances."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFormOptions();
  }, [fetchFormOptions]);

  useEffect(() => {
    fetchSeances();
  }, [fetchSeances]);

  // ----------- FILTRAGE DYNAMIQUE PAR NIVEAU AVANT MATIERE/ENSEIGNANT -----------
  // Quand le niveau change : filtre matières et enseignants pour ce niveau
  useEffect(() => {
    const niveauId = createForm.getValues().niveauId;
    if (!niveauId) {
      setFilteredMatieresForForm([]);
      setFilteredEnseignantsForForm([]);
      createForm.setValue("matiereId", "");
      createForm.setValue("enseignantId", "");
      return;
    }

    // Filtrer matières du niveau sélectionné
    const matieresFiltrees = matieresOptions.filter(
      (m) => m.niveau.id === niveauId
    );
    setFilteredMatieresForForm(matieresFiltrees);

    // Filtrer enseignants qui enseignent au moins une matière de ce niveau
    const enseignantsIdsPourCeNiveau = enseignantMatiereRelations
      .filter((rel) => matieresFiltrees.some((m) => m.id === rel.matiereId))
      .map((rel) => rel.enseignantId);

    const enseignantsFiltrees = enseignantsOptions.filter((e) =>
      enseignantsIdsPourCeNiveau.includes(e.id)
    );
    setFilteredEnseignantsForForm(enseignantsFiltrees);

    // Reset matière et enseignant à chaque changement de niveau
    createForm.setValue("matiereId", "");
    createForm.setValue("enseignantId", "");
  }, [
    createForm.getValues().niveauId,
    matieresOptions,
    enseignantsOptions,
    enseignantMatiereRelations,
  ]);

  // Quand la matière change : filtre les enseignants de cette matière, auto-select si un seul
  useEffect(() => {
    const matiereId = createForm.getValues().matiereId;
    if (!matiereId) {
      setFilteredEnseignantsForForm([]);
      createForm.setValue("enseignantId", "");
      return;
    }

    // Trouve les enseignants qui enseignent cette matière (et qui sont dans ce niveau)
    const enseignantsPourMatiere = enseignantMatiereRelations
      .filter((rel) => rel.matiereId === matiereId)
      .map((rel) => rel.enseignantId);

    const enseignantsFiltrees = enseignantsOptions.filter((e) =>
      enseignantsPourMatiere.includes(e.id)
    );
    setFilteredEnseignantsForForm(enseignantsFiltrees);

    // Auto-select si un seul enseignant
    if (enseignantsFiltrees.length === 1) {
      createForm.setValue("enseignantId", enseignantsFiltrees[0].id, {
        shouldValidate: true,
      });
    } else if (
      !enseignantsPourMatiere.includes(createForm.getValues().enseignantId)
    ) {
      createForm.setValue("enseignantId", "");
    }
  }, [
    createForm.getValues().matiereId,
    enseignantsOptions,
    enseignantMatiereRelations,
  ]);

  // Reset matières/enseignants quand modal création s'ouvre
  useEffect(() => {
    if (isCreateModalOpen) {
      setFilteredMatieresForForm([]);
      setFilteredEnseignantsForForm([]);
      createForm.reset({
        niveauId: "",
        matiereId: "",
        enseignantId: "",
        salleId: "",
        heureDebut: "08:00",
        heureFin: "10:00",
        anneeScolaire: anneeScolaireOptions[anneeScolaireOptions.length - 6],
        semestre: null,
      });
    }
  }, [isCreateModalOpen, createForm]);

  // ---------- LOGIQUE SIMILAIRE POUR LE FORMULAIRE D'EDITION -------------------
  useEffect(() => {
    if (isEditModalOpen && selectedSeance) {
      // Filtre matières et enseignants pour le niveau de la séance
      const matieresFiltrees = matieresOptions.filter(
        (m) => m.niveau.id === selectedSeance.niveauId
      );
      setFilteredMatieresForForm(matieresFiltrees);

      const enseignantsIdsPourCeNiveau = enseignantMatiereRelations
        .filter((rel) => matieresFiltrees.some((m) => m.id === rel.matiereId))
        .map((rel) => rel.enseignantId);

      const enseignantsFiltrees = enseignantsOptions.filter((e) =>
        enseignantsIdsPourCeNiveau.includes(e.id)
      );
      setFilteredEnseignantsForForm(enseignantsFiltrees);

      // Remplir le form d'édition
      editForm.reset({
        niveauId: selectedSeance.niveauId,
        enseignantId: selectedSeance.enseignantId,
        matiereId: selectedSeance.matiereId,
        salleId: selectedSeance.salleId,
        heureDebut: formatTime(selectedSeance.heureDebut),
        heureFin: formatTime(selectedSeance.heureFin),
        anneeScolaire: selectedSeance.anneeScolaire,
        semestre: selectedSeance.semestre,
      });
    }
  }, [
    isEditModalOpen,
    selectedSeance,
    matieresOptions,
    enseignantsOptions,
    enseignantMatiereRelations,
    editForm,
  ]);

  useEffect(() => {
    const niveauId = editForm.getValues().niveauId;
    if (!niveauId) {
      setFilteredMatieresForForm([]);
      setFilteredEnseignantsForForm([]);
      editForm.setValue("matiereId", "");
      editForm.setValue("enseignantId", "");
      return;
    }

    const matieresFiltrees = matieresOptions.filter(
      (m) => m.niveau.id === niveauId
    );
    setFilteredMatieresForForm(matieresFiltrees);

    const enseignantsIdsPourCeNiveau = enseignantMatiereRelations
      .filter((rel) => matieresFiltrees.some((m) => m.id === rel.matiereId))
      .map((rel) => rel.enseignantId);

    const enseignantsFiltrees = enseignantsOptions.filter((e) =>
      enseignantsIdsPourCeNiveau.includes(e.id)
    );
    setFilteredEnseignantsForForm(enseignantsFiltrees);
  }, [
    editForm.getValues().niveauId,
    matieresOptions,
    enseignantsOptions,
    enseignantMatiereRelations,
  ]);

  useEffect(() => {
    const matiereId = editForm.getValues().matiereId;
    if (!matiereId) {
      setFilteredEnseignantsForForm([]);
      editForm.setValue("enseignantId", "");
      return;
    }

    const enseignantsPourMatiere = enseignantMatiereRelations
      .filter((rel) => rel.matiereId === matiereId)
      .map((rel) => rel.enseignantId);

    const enseignantsFiltrees = enseignantsOptions.filter((e) =>
      enseignantsPourMatiere.includes(e.id)
    );
    setFilteredEnseignantsForForm(enseignantsFiltrees);

    if (enseignantsFiltrees.length === 1) {
      editForm.setValue("enseignantId", enseignantsFiltrees[0].id, {
        shouldValidate: true,
      });
    } else if (
      !enseignantsPourMatiere.includes(editForm.getValues().enseignantId ?? "")
    ) {
      editForm.setValue("enseignantId", "");
    }
  }, [
    editForm.getValues().matiereId,
    enseignantsOptions,
    enseignantMatiereRelations,
  ]);

  // Handle Create Seance
  const onCreateSubmit = async (values: CreateFormValues) => {
    setSubmitLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token d'authentification manquant.");
      setSubmitLoading(false);
      return;
    }

    // -----> Vérification des conflits côté frontend
    const conflits = detectSeanceConflicts(
      {
        salleId: values.salleId,
        enseignantId: values.enseignantId,
        date: values.date,
        heureDebut: values.heureDebut,
        heureFin: values.heureFin,
        anneeScolaire: values.anneeScolaire,
        semestre: values.semestre ?? null,
      },
      seances
    );

    if (conflits.anyConflict) {
      if (conflits.salle) toast.error(conflits.salle);
      if (conflits.enseignant) toast.error(conflits.enseignant);
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        ...values,
        semestre: values.semestre === "" ? null : values.semestre,
      };

      const response = await fetch("http://localhost:3000/api/seances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Échec de la création de la séance."
        );
      }

      toast.success("Séance créée avec succès !");
      setIsCreateModalOpen(false);
      createForm.reset();
      fetchSeances();
    } catch (err: any) {
      console.error("Erreur lors de la création de la séance:", err);
      toast.error(err.message || "Erreur lors de la création de la séance.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Edit Seance
  const onEditSubmit = async (values: UpdateFormValues) => {
    if (!selectedSeance) return;

    setSubmitLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token d'authentification manquant.");
      setSubmitLoading(false);
      return;
    }

    // -----> Vérification des conflits côté frontend (exclut la séance éditée)
    const conflits = detectSeanceConflicts(
    {
      salleId: values.salleId ?? "",
      enseignantId: values.enseignantId ?? "",
      date: values.date ?? "",
      heureDebut: values.heureDebut ?? "",
      heureFin: values.heureFin ?? "",
      anneeScolaire: values.anneeScolaire ?? "",
      semestre: values.semestre ?? null,
    },
      seances,
      selectedSeance?.id // dans le cas de l'édition
    );

    if (conflits.anyConflict) {
      if (conflits.salle) toast.error(conflits.salle);
      if (conflits.enseignant) toast.error(conflits.enseignant);
      setSubmitLoading(false);
      return;
    }
    
    try {
      const payload = {
        ...values,
        semestre: values.semestre === "" ? null : values.semestre,
      };

      const response = await fetch(
        `http://localhost:3000/api/seances/${selectedSeance.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Échec de la mise à jour de la séance."
        );
      }

      toast.success("Séance mise à jour avec succès !");
      setIsEditModalOpen(false);
      editForm.reset();
      fetchSeances();
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour de la séance:", err);
      toast.error(err.message || "Erreur lors de la mise à jour de la séance.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Delete Seance
  const onDeleteConfirm = async () => {
    if (!selectedSeance) return;

    setSubmitLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token d'authentification manquant.");
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/seances/${selectedSeance.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Échec de la suppression de la séance."
        );
      }

      toast.success("Séance supprimée avec succès !");
      setIsDeleteConfirmOpen(false);
      setSelectedSeance(null);
      fetchSeances();
    } catch (err: any) {
      console.error("Erreur lors de la suppression de la séance:", err);
      toast.error(err.message || "Erreur lors de la suppression de la séance.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (seance: Seance) => {
    setSelectedSeance(seance);
    setIsEditModalOpen(true); // This will trigger the useEffect for initialization
  };

  // Open Delete Confirm
  const openDeleteConfirm = (seance: Seance) => {
    setSelectedSeance(seance);
    setIsDeleteConfirmOpen(true);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      niveauId: "all",
      enseignantId: "all",
      matiereId: "all",
      salleId: "all",
      // jour: "all",
      anneeScolaire: "all",
      semestre: "all",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/20 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <motion.div
                    className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/25"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CalendarCheck className="h-10 w-10 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                      Gestion des Séances
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      Planifiez et organisez vos cours efficacement
                    </p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-5 text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 cursor-pointer transition-all duration-300"
                  >
                    <PlusCircle className="h-6 w-6 mr-3" />
                    Ajouter une Séance
                    <Sparkles className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <Card className="mb-8 bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/5 border border-white/20 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-white/20">
              <CardTitle className="flex items-center text-2xl font-bold text-gray-900">
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-4 shadow-lg"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Filter className="h-6 w-6 text-white" />
                </motion.div>
                Filtres de recherche
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Affinez la liste des séances par les critères suivants.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <GraduationCap className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par niveau
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("niveauId", val)
                      }
                      value={filters.niveauId}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par niveau" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Tous les niveaux
                          </span>
                        </SelectItem>
                        {niveauxOptions.map((niv) => (
                          <SelectItem
                            key={niv.id}
                            value={niv.id}
                            className="rounded-lg cursor-pointer"
                          >
                            {niv.nom} ({niv.departement.nom})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par enseignant
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("enseignantId", val)
                      }
                      value={filters.enseignantId}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-green-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par enseignant" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Tous les enseignants
                          </span>
                        </SelectItem>
                        {enseignantsOptions.map((ens) => (
                          <SelectItem
                            key={ens.id}
                            value={ens.id}
                            className="rounded-lg cursor-pointer"
                          >
                            {ens.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par matière
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("matiereId", val)
                      }
                      value={filters.matiereId}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-purple-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par matière" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Toutes les matières
                          </span>
                        </SelectItem>
                        {matieresOptions.map((mat) => (
                          <SelectItem
                            key={mat.id}
                            value={mat.id}
                            className="rounded-lg cursor-pointer"
                          >
                            {mat.nom} ({mat.niveau.nom})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par salle
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("salleId", val)
                      }
                      value={filters.salleId}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-orange-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par salle" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Toutes les salles
                          </span>
                        </SelectItem>
                        {sallesOptions.map((salle) => (
                          <SelectItem
                            key={salle.id}
                            value={salle.id}
                            className="rounded-lg cursor-pointer"
                          >
                            {salle.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative group"
                >
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Filtrer par date
                    </span>
                  </div>
                  <Input
                    type="date"
                    value={filters.date || ""}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                    className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md"
                  />
                </motion.div> */}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par année scolaire
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("anneeScolaire", val)
                      }
                      value={filters.anneeScolaire}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-teal-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par année scolaire" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Toutes les années
                          </span>
                        </SelectItem>
                        {anneeScolaireOptions.map((year) => (
                          <SelectItem
                            key={year}
                            value={year}
                            className="rounded-lg cursor-pointer"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Filtrer par semestre
                      </span>
                    </div>
                    <Select
                      onValueChange={(val) =>
                        handleFilterChange("semestre", val)
                      }
                      value={filters.semestre}
                    >
                      <SelectTrigger className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-pink-500 rounded-xl px-4 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Filtrer par semestre" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        <SelectItem
                          value="all"
                          className="rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            Tous les semestres
                          </span>
                        </SelectItem>
                        {semestreOptions.map((sem) => (
                          <SelectItem
                            key={sem}
                            value={sem}
                            className="rounded-lg cursor-pointer"
                          >
                            {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </div>
              <div className="flex justify-end mt-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-700 hover:text-red-600 px-6 py-5 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md bg-transparent cursor-pointer"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-16 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl mb-6"
              >
                <Loader2 className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Chargement des séances
              </h3>
              <p className="text-gray-600 text-lg">Veuillez patienter...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl shadow-2xl border-2 border-red-200/50"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="p-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-xl mb-6"
              >
                <AlertCircle className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-red-700 text-center text-lg">{error}</p>
            </motion.div>
          ) : seances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl border-2 border-blue-200/50"
            >
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl mb-6"
              >
                <Info className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">
                Aucune séance trouvée
              </h3>
              <p className="text-blue-700 text-center text-lg">
                {Object.values(filters).some((f) => f !== "all")
                  ? "Aucune séance ne correspond à vos critères de filtre."
                  : "Commencez par ajouter une nouvelle séance."}
              </p>
            </motion.div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-white/20">
                      <TableHead>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span>Date</span>
                        </div>
                      </TableHead>
                      {/* <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <span>Jour</span>
                        </div>
                      </TableHead> */}
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <span>Heure</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-5 w-5 text-gray-600" />
                          <span>Niveau</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-gray-600" />
                          <span>Matière</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-gray-600" />
                          <span>Enseignant</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-gray-600" />
                          <span>Salle</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        Année Scolaire
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6">
                        Semestre
                      </TableHead>
                      <TableHead className="text-gray-900 font-bold text-base py-6 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {seances.map((seance, index) => (
                        <motion.tr
                          key={seance.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 border-b border-gray-100/50"
                          whileHover={{ scale: 1.01 }}
                        >
                          <TableCell className="py-6">
                            <span className="font-medium text-gray-900">
                              {formatDate(seance.date)}
                            </span>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center space-x-2 text-gray-700">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">
                                {formatTime(seance.heureDebut)} -{" "}
                                {formatTime(seance.heureFin)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">
                                {seance.niveau.nom}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({seance.niveau.departement.nom})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                              <span className="font-medium text-gray-900">
                                {seance.matiere.nom}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {seance.enseignant.utilisateur.nom.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">
                                {seance.enseignant.utilisateur.nom}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-gray-900">
                                {seance.salle.nom}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium">
                              {seance.anneeScolaire}
                            </span>
                          </TableCell>
                          <TableCell className="py-6">
                            {seance.semestre ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium">
                                {seance.semestre}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-6">
                            <div className="flex justify-end space-x-2">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(seance)}
                                  className="cursor-pointer border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 py-5"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteConfirm(seance)}
                                  className="cursor-pointer border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 py-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
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
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Seance Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.1%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
            <div className="relative flex items-center space-x-4">
              <motion.div
                className="p-4 bg-white/20 rounded-2xl"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PlusCircle className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-3xl font-bold">
                  Ajouter une nouvelle séance
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-lg mt-2">
                  Remplissez les informations pour planifier une nouvelle
                  séance.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={createForm.control}
                    name="niveauId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-niveau"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                          Niveau
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!!watchedMatiereId}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-niveau"
                              name="niveau"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un niveau" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {niveauxOptions.map((niv) => (
                              <SelectItem
                                key={niv.id}
                                value={niv.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {niv.nom} ({niv.departement.nom})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="enseignantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-enseignant"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <User className="h-5 w-5 mr-2 text-green-600" />
                          Enseignant
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedMatiereId}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-enseignant"
                              name="enseignant"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-green-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un enseignant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {filteredEnseignantsForForm.map((ens) => (
                              <SelectItem
                                key={ens.id}
                                value={ens.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {ens.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="matiereId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-matiere"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                          Matière
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedNiveauId}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-matiere"
                              name="matiere"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-purple-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez une matière" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {filteredMatieresForForm.map((mat) => (
                              <SelectItem
                                key={mat.id}
                                value={mat.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {mat.nom} ({mat.niveau.nom})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="salleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-salle"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                          Salle
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-salle"
                              name="salle"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-orange-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez une salle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {sallesOptions.map((salle) => (
                              <SelectItem
                                key={salle.id}
                                value={salle.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {salle.nom} (Capacité: {salle.capacite})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
              control={createForm.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor="create-date"
                    className="text-gray-900 font-semibold flex items-center"
                  >
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Date de la séance
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="create-date"
                      type="date"
                      autoComplete="off"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="h-12 text-base border-2 border-blue-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                  <FormField
                    control={createForm.control}
                    name="heureDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-heure-debut"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Heure de début (HH:MM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="create-heure-debut"
                            type="time"
                            autoComplete="off"
                            {...field}
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="heureFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-heure-fin"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-red-600" />
                          Heure de fin (HH:MM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="create-heure-fin"
                            type="time"
                            autoComplete="off"
                            {...field}
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-red-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="anneeScolaire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-annee"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                          Année Scolaire
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-annee"
                              name="anneeScolaire"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-teal-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez l'année scolaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {anneeScolaireOptions.map((year) => (
                              <SelectItem
                                key={year}
                                value={year}
                                className="rounded-lg cursor-pointer"
                              >
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="semestre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="create-semestre"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-pink-600" />
                          Semestre (Optionnel)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="create-semestre"
                              name="semestre"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-pink-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un semestre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            <SelectItem
                              value="none"
                              className="rounded-lg cursor-pointer"
                            >
                              Aucun
                            </SelectItem>
                            {semestreOptions.map((sem) => (
                              <SelectItem
                                key={sem}
                                value={sem}
                                className="rounded-lg cursor-pointer"
                              >
                                {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-8 flex justify-end gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={submitLoading}
                      className="cursor-pointer px-8 py-5 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                    >
                      Annuler
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={submitLoading}
                      className="px-8 py-5 cursor-pointer bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Créer la séance
                        </>
                      )}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Seance Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.1%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
            <div className="relative flex items-center space-x-4">
              <motion.div
                className="p-4 bg-white/20 rounded-2xl"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Edit className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-3xl font-bold">
                  Modifier la séance
                </DialogTitle>
                <DialogDescription className="text-orange-100 text-lg mt-2">
                  Mettez à jour les informations de la séance sélectionnée.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={editForm.control}
                    name="niveauId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-niveau"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                          Niveau
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-niveau"
                              name="niveau"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un niveau" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {niveauxOptions.map((niv) => (
                              <SelectItem
                                key={niv.id}
                                value={niv.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {niv.nom} ({niv.departement.nom})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="enseignantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-enseignant"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <User className="h-5 w-5 mr-2 text-green-600" />
                          Enseignant
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedMatiereIdEdit}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-enseignant"
                              name="enseignant"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-green-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un enseignant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {filteredEnseignantsForForm.map((ens) => (
                              <SelectItem
                                key={ens.id}
                                value={ens.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {ens.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="matiereId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-matiere"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                          Matière
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedNiveauIdEdit}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-matiere"
                              name="matiere"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-purple-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez une matière" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {filteredMatieresForForm.map((mat) => (
                              <SelectItem
                                key={mat.id}
                                value={mat.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {mat.nom} ({mat.niveau.nom})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="salleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-salle"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                          Salle
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-salle"
                              name="salle"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-orange-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez une salle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {sallesOptions.map((salle) => (
                              <SelectItem
                                key={salle.id}
                                value={salle.id}
                                className="rounded-lg cursor-pointer"
                              >
                                {salle.nom} (Capacité: {salle.capacite})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
              control={editForm.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    htmlFor="edit-date"
                    className="text-gray-900 font-semibold flex items-center"
                  >
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Date de la séance
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="edit-date"
                      type="date"
                      autoComplete="off"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="h-12 text-base border-2 border-blue-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                  <FormField
                    control={editForm.control}
                    name="heureDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-heure-debut"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Heure de début (HH:MM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="edit-heure-debut"
                            type="time"
                            autoComplete="off"
                            {...field}
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-blue-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="heureFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-heure-fin"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-red-600" />
                          Heure de fin (HH:MM)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="edit-heure-fin"
                            type="time"
                            autoComplete="off"
                            {...field}
                            className="h-12 text-base border-2 border-gray-200/50 focus:border-red-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="anneeScolaire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-annee"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                          Année Scolaire
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-annee"
                              name="anneeScolaire"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-teal-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez l'année scolaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            {anneeScolaireOptions.map((year) => (
                              <SelectItem
                                key={year}
                                value={year}
                                className="rounded-lg cursor-pointer"
                              >
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="semestre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="edit-semestre"
                          className="text-gray-900 font-semibold flex items-center"
                        >
                          <Clock className="h-5 w-5 mr-2 text-pink-600" />
                          Semestre (Optionnel)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger
                              id="edit-semestre"
                              name="semestre"
                              className="cursor-pointer h-12 text-base border-2 border-gray-200/50 focus:border-pink-500 rounded-xl px-4 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm hover:bg-white/80 shadow-sm"
                            >
                              <SelectValue placeholder="Sélectionnez un semestre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                            <SelectItem
                              value="none"
                              className="rounded-lg cursor-pointer"
                            >
                              Aucun
                            </SelectItem>
                            {semestreOptions.map((sem) => (
                              <SelectItem
                                key={sem}
                                value={sem}
                                className="rounded-lg cursor-pointer"
                              >
                                {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-8 flex justify-end gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={submitLoading}
                      className="px-8 py-5 cursor-pointer border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                    >
                      Annuler
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={submitLoading}
                      className="px-8 py-5 cursor-pointer bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 hover:from-orange-700 hover:via-red-700 hover:to-orange-800 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-5 w-5" />
                          Sauvegarder les modifications
                        </>
                      )}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 via-pink-600 to-red-700 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.1%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
            <div className="relative flex items-center space-x-4">
              <motion.div
                className="p-4 bg-white/20 rounded-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Trash2 className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-3xl font-bold">
                  Confirmer la suppression
                </DialogTitle>
                <DialogDescription className="text-red-100 text-lg mt-2">
                  Cette action est irréversible
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8">
      <div className="text-center mb-8">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Êtes-vous sûr ?
          </h3>
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer la séance de{" "}
            <span className="font-semibold text-gray-900">
              {selectedSeance?.matiere.nom}
            </span>{" "}
            avec{" "}
            <span className="font-semibold text-gray-900">
              {selectedSeance?.enseignant.utilisateur.nom}
            </span>{" "}
            le{" "}
            <span className="font-semibold text-gray-900">
              {selectedSeance
                ? formatDate(selectedSeance.date)
                : ""}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-gray-900">
              {selectedSeance
                ? formatTime(selectedSeance.heureDebut)
                : ""}{" "}
              à{" "}
              {selectedSeance ? formatTime(selectedSeance.heureFin) : ""}
            </span>{" "}
            ? Cette action est irréversible.
          </p>
        </div>
      </div>

            <DialogFooter className="flex justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={submitLoading}
                  className="px-8 py-5 cursor-pointer border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                >
                  Annuler
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onDeleteConfirm}
                  disabled={submitLoading}
                  className="px-8 py-5 cursor-pointer bg-gradient-to-r from-red-600 via-pink-600 to-red-700 hover:from-red-700 hover:via-pink-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-5 w-5" />
                      Supprimer
                    </>
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
