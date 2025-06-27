// src/app/(auth)/layout.tsx

import React from 'react';

// Ce layout enveloppera toutes les pages d'authentification (login, register, forgot-password, reset-password).
// Il fournit un style de fond et un centrage pour les formulaires.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Nous utilisons Tailwind CSS pour styliser le fond et centrer le contenu.
    // min-h-screen assure que le conteneur prend au moins toute la hauteur de l'écran.
    // flex items-center justify-center centre le contenu horizontalement et verticalement.
    // bg-gradient-to-br from-blue-50 to-purple-50 utilise notre palette de couleurs pour un fond doux.
    // p-4 assure un peu de padding sur les petits écrans.
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Le 'children' ici représentera la page spécifique (par exemple, login/page.tsx, register/page.tsx).
        Chaque page sera rendue à l'intérieur de ce layout.
      */}
      {children}
    </div>
  );
}
