// src/app/(app)/layout.tsx
'use client'; // Ce layout sera un Client Component car il gérera l'état de l'authentification et les redirections.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Pour la redirection
import { motion } from 'framer-motion'; // Pour de futures animations de layout
import { Loader2 } from 'lucide-react'; // Icône de chargement

// Ce layout enveloppe toutes les pages de l'application nécessitant une authentification.
// Il vérifiera la présence d'un token d'accès et gérera la redirection si l'utilisateur n'est pas connecté.
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token d'accès existe dans le localStorage
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      // Si pas de token, rediriger vers la page de connexion
      router.push('/login');
    } else {
      // Pour une application réelle, vous devriez également valider le token avec le backend
      // (par exemple, en envoyant une requête à /auth/profile) pour s'assurer qu'il est valide et non expiré.
      // Pour l'instant, nous nous basons simplement sur sa présence.
      setIsAuthenticated(true);
    }
    setIsLoading(false); // Fin du chargement initial
  }, [router]);

  if (isLoading) {
    // Afficher un loader pendant la vérification de l'authentification
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Si l'utilisateur est authentifié, rendre les enfants (la page demandée)
  return isAuthenticated ? (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Ici, nous pourrions ajouter une barre de navigation globale ou une barre latérale */}
      {/* <Navbar /> */}
      {/* <Sidebar /> */}

      <main className="flex-grow">
        {children}
      </main>

      {/* Un footer peut aussi être ajouté ici pour toutes les pages authentifiées si nécessaire */}
      {/* <AuthenticatedFooter /> */}
    </div>
  ) : null; // Si non authentifié et en cours de redirection, ne rien rendre
}
