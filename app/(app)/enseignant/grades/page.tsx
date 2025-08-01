"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  Save,
  AlertTriangle,
  Users,
  Search,
  ListFilter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

// Définition de l'énumération des rôles (doit correspondre au backend)
enum Role {
  ADMIN = "ADMIN",
  ETUDIANT = "ETUDIANT",
  ENSEIGNANT = "ENSEIGNANT",
}

// Interfaces pour la structure des données utilisateur
interface UserInfo {
  id: string;
  nom: string;
  email: string;
  role: Role;
  enseignant?: {
    id: string;
    matieres: Array<{
      matiere: {
        id: string;
        nom: string;
        niveau: { nom: string };
      };
    }>;
  };
}

// Interface pour la structure des notes des étudiants
interface StudentGrade {
  studentId: string;
  studentName: string;
  matricule: string;
  grade: number | null;
}

// Données fictives pour simuler un backend.
// REMARQUE: Cette structure devra être remplacée par de vraies requêtes API.
const mockStudents: { [key: string]: StudentGrade[] } = {
  "matiere-1": [ // Matière 1: Mathématiques
    { studentId: "etudiant-1", studentName: "Marie Dubois", matricule: "E-1001", grade: 15.5 },
    { studentId: "etudiant-2", studentName: "Jean Dupont", matricule: "E-1002", grade: 12.0 },
    { studentId: "etudiant-3", studentName: "Sarah Martin", matricule: "E-1003", grade: 18.0 },
  ],
  "matiere-2": [ // Matière 2: Informatique
    { studentId: "etudiant-1", studentName: "Marie Dubois", matricule: "E-1001", grade: 16.0 },
    { studentId: "etudiant-4", studentName: "Lucas Bernard", matricule: "E-1004", grade: 9.5 },
  ],
  "matiere-3": [ // Matière 3: Physique (aucune note)
    { studentId: "etudiant-1", studentName: "Marie Dubois", matricule: "E-1001", grade: null },
    { studentId: "etudiant-2", studentName: "Jean Dupont", matricule: "E-1002", grade: null },
    { studentId: "etudiant-3", studentName: "Sarah Martin", matricule: "E-1003", grade: null },
    { studentId: "etudiant-4", studentName: "Lucas Bernard", matricule: "E-1004", grade: null },
  ],
};

export default function EnseignantGradesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [selectedMatiereId, setSelectedMatiereId] = useState<string | null>(null);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserInfo = JSON.parse(storedUser);
        if (parsedUser.role !== Role.ENSEIGNANT) {
          router.push("/dashboard");
        } else {
          setUser(parsedUser);
          if (
            parsedUser.enseignant &&
            Array.isArray(parsedUser.enseignant.matieres) &&
            parsedUser.enseignant.matieres.length > 0
          ) {
            // Sélectionne la première matière par défaut
            setSelectedMatiereId(parsedUser.enseignant.matieres[0].matiere.id);
          }
        }
      } catch (e) {
        console.error("Erreur de parsing des infos utilisateur:", e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    // Simuler le chargement des notes lorsque la matière sélectionnée change
    if (selectedMatiereId) {
      // REMARQUE: Ici, une vraie application ferait un appel API pour
      // récupérer les notes de la matière sélectionnée.
      // Par exemple: fetch(`/api/grades?matiereId=${selectedMatiereId}`)
      const fetchedGrades = mockStudents[selectedMatiereId] || [];
      setGrades(fetchedGrades);
    } else {
      setGrades([]);
    }
  }, [selectedMatiereId]);

  const handleGradeChange = (studentId: string, value: string) => {
    // Ne permet que des nombres et des points (pour les décimales)
    if (!/^\d*\.?\d*$/.test(value)) return;

    const newGrades = grades.map((grade) =>
      grade.studentId === studentId ? { ...grade, grade: parseFloat(value) || null } : grade
    );
    setGrades(newGrades);
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    // REMARQUE: Une vraie application ferait un appel API POST/PUT pour
    // mettre à jour les notes dans la base de données.
    try {
      // Simuler une requête API avec un délai
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Notes sauvegardées:", grades);
      // Afficher un message de succès (peut-être un toast)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notes:", error);
      // Afficher un message d'erreur
    } finally {
      setIsSaving(false);
    }
  };

  const filteredGrades = useMemo(() => {
    if (!searchTerm) {
      return grades;
    }
    return grades.filter((grade) =>
      grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [grades, searchTerm]);

  const currentMatiere = useMemo(() => {
    return user?.enseignant?.matieres.find(
      (m) => m.matiere.id === selectedMatiereId
    )?.matiere;
  }, [user, selectedMatiereId]);


  if (isLoading || !user || user.role !== Role.ENSEIGNANT) {
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
    );
  }

  // Si l'enseignant n'a pas de matières
  if (!user.enseignant || user.enseignant.matieres.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card className="bg-white/90 p-8 text-center border-orange-200">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune matière trouvée</h2>
          <p className="text-gray-600">
            Il semble que vous n'ayez pas encore de matières assignées.
            Veuillez contacter l'administrateur.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="mt-6">
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-7xl mx-auto py-8 sm:py-12 px-4"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-yellow-600" />
            Gestion des Notes
          </h1>
          <p className="text-gray-600 mt-1">Saisissez et modifiez les notes de vos étudiants.</p>
        </div>
      </div>

      <Card className="shadow-lg p-6 bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="matiere-select" className="sr-only">Sélectionner une matière</Label>
            <Select onValueChange={setSelectedMatiereId} defaultValue={selectedMatiereId || ""}>
              <SelectTrigger className="w-full md:w-[300px] h-12">
                <SelectValue placeholder="Sélectionner une matière..." />
              </SelectTrigger>
              <SelectContent>
                {user.enseignant.matieres.map((em) => (
                  <SelectItem key={em.matiere.id} value={em.matiere.id}>
                    {em.matiere.nom} - {em.matiere.niveau.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 items-center flex-1 md:flex-grow-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-12 rounded-xl"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 w-12 p-0 flex-shrink-0">
                  <ListFilter className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4">
                <p className="text-sm text-gray-600">
                  Filtres à venir...
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {selectedMatiereId ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Notes pour la matière : <span className="text-yellow-600">{currentMatiere?.nom}</span>
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    <TableHead>Nom de l'étudiant</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead className="w-[150px] text-center">Note (sur 20)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {filteredGrades.length > 0 ? (
                    filteredGrades.map((student, index) => (
                      <TableRow key={student.studentId} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell className="text-gray-600">{student.matricule}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="20"
                            placeholder="Saisir la note"
                            value={student.grade !== null ? student.grade.toString() : ""}
                            onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                            className="w-full text-center"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                        Aucun étudiant trouvé pour cette matière.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder les notes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <Users className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Veuillez sélectionner une matière pour voir les étudiants et saisir les notes.</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
