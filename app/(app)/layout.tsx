//app/(app)/layout.tsx

"use client" // Ce layout est un Client Component.

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation" // Ajout de usePathname
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"

// Énumération des rôles (doit correspondre au backend et à vos autres fichiers)
enum Role {
  ADMIN = "ADMIN",
  ETUDIANT = "ETUDIANT",
  ENSEIGNANT = "ENSEIGNANT",
}

// Interface pour les informations utilisateur étendues (doit correspondre à DashboardPage)
interface UserInfo {
  id: string
  nom: string
  email: string
  role: Role // Utilise l'énumération pour le rôle
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() // Pour déterminer la page actuelle
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Déterminez la 'currentPage' pour le header en fonction du pathname
  const getCurrentPage = (path: string) => {
    if (path.includes("/departements")) return "departements"
    if (path.includes("/admin/niveaux")) return "niveaux"
    if (path.includes("admin/matieres")) return "matieres"
    if (path.includes("/admin/salles")) return "salles"
    if (path.includes("/admin/seances")) return "seances";
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/emploi-du-temps")) return "emploi-du-temps";
    // NOUVEAUTÉ : Ajout de la page de notes pour les enseignants
    if (path.includes("/enseignant/grades")) return "Notes";
    // Ajoutez d'autres conditions ici pour les pages "enseignant" et "etudiant"
    return "dashboard" // Par défaut pour le dashboard
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken || !storedUser) {
      router.push("/login")
      setIsLoading(false)
      return
    }

    try {
      const parsedUser: UserInfo = JSON.parse(storedUser);
      setUser(parsedUser);

      // CORRECTION : Les chemins d'accès pour les admins sont plus spécifiques
      const adminOnlyPaths = [
        "/admin/departements",
        "/admin/niveaux",
        "/admin/matieres",
        "/admin/salles",
        "/admin/seances",
        "/admin/users",
      ];
      // NOUVEAUTÉ : Définition des chemins d'accès spécifiques aux enseignants
      const enseignantOnlyPaths = [
        "/enseignant/grades",
      ];

      // NOUVEAUTÉ : Vérification si l'utilisateur essaie d'accéder à une page d'admin ou d'enseignant
      const isTryingToAccessAdminPage = adminOnlyPaths.some((path) => pathname.startsWith(path));
      const isTryingToAccessEnseignantPage = enseignantOnlyPaths.some((path) => pathname.startsWith(path));

      // NOUVEAUTÉ : Logique de redirection si le rôle ne correspond pas
      if (parsedUser.role !== Role.ADMIN && isTryingToAccessAdminPage) {
        router.push("/dashboard");
        console.warn("Accès non autorisé : rôle non-ADMIN pour une page d'administration.");
        return;
      }
      if (parsedUser.role !== Role.ENSEIGNANT && isTryingToAccessEnseignantPage) {
        router.push("/dashboard");
        console.warn("Accès non autorisé : rôle non-ENSEIGNANT pour une page d'enseignant.");
        return;
      }
      
    } catch (e) {
      console.error("Erreur lors du parsing des informations utilisateur dans le layout:", e);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname]); // Dépend de pathname pour les redirections basées sur le chemin

  // Fonction pour afficher le modal de confirmation de déconnexion
  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  // Fonction de déconnexion confirmée
  const confirmLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    setShowLogoutModal(false)
    router.push("/login")
  }

  // Fonction pour annuler la déconnexion
  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  // Si l'utilisateur n'est pas un admin, n'affichez pas AdminHeader
  if (user && user.role === Role.ADMIN) {
    // Si vous aviez un AdminHeader, vous pourriez le mettre ici
  }

  // Affichez un header commun pour tous les utilisateurs connectés
  return user ? (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader user={user} onLogout={handleLogoutClick} currentPage={getCurrentPage(pathname)} />
      <main className="flex-grow">{children}</main>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelLogout}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header du modal */}
              <div className="relative bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={cancelLogout}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </motion.button>

                <div className="flex items-center space-x-4">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="p-3 bg-white/20 rounded-full"
                  >
                    <LogOut className="h-8 w-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold">Confirmation de déconnexion</h3>
                    <p className="text-red-100 text-sm mt-1">Action irréversible</p>
                  </div>
                </div>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-700 text-lg mb-2">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                  <p className="text-gray-500 text-sm">Vous devrez saisir vos identifiants pour vous reconnecter.</p>
                </div>

                {/* Informations utilisateur */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.nom}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      variant="outline"
                      onClick={cancelLogout}
                      className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold bg-transparent cursor-pointer"
                    >
                      Annuler
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={confirmLogout}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
}