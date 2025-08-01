"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarCheck, Mail, ArrowLeft, CheckCircle, Clock } from "lucide-react"

export default function ForgotPasswordConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -top-36 -left-36"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-gradient-to-r from-indigo-200/15 to-blue-200/15 rounded-full blur-3xl -bottom-32 -right-32"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-lg mx-auto"
        >
          {/* Conteneur principal avec ombre */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Bordure décorative */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl" />

            {/* Logo/Icône avec animation */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
            >
              <div className="relative">
                <motion.div
                  className="p-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CalendarCheck className="h-14 w-14 text-white" />
                </motion.div>

                {/* Badge de succès animé */}
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle className="h-4 w-4 text-white" />
                </motion.div>

                {/* Cercles décoratifs */}
                <motion.div
                  className="absolute -inset-6 border-2 border-blue-200/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
            </motion.div>

            {/* Titre principal avec animation */}
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Email envoyé !
            </motion.h1>

            {/* Message explicatif avec animations séquentielles */}
            <motion.div
              className="space-y-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.p
                className="text-gray-800 leading-relaxed text-lg font-normal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Nous avons envoyé un lien de réinitialisation de mot de passe à votre adresse email.
              </motion.p>

              <motion.p
                className="text-gray-600 leading-relaxed font-normal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                Si vous ne le recevez pas dans quelques minutes, vérifiez votre dossier spam.
              </motion.p>
            </motion.div>

            {/* Zone d'information avec icône */}
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 mb-8 shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold text-blue-800">Vérifiez votre boîte email</span>
              </div>
              <p className="text-blue-700 text-sm">
                Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe
              </p>
            </motion.div>

            {/* Alerte temporelle */}
            <motion.div
              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 mb-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <div className="flex items-center justify-center gap-2 text-amber-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Le lien expire dans 24 heures</span>
              </div>
            </motion.div>

            {/* Lien de retour avec animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Retour à la connexion
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Lien alternatif */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <Link
              href="/forgot-password"
              className="text-gray-600 hover:text-blue-600 font-medium hover:underline transition-colors duration-200 text-sm"
            >
              Renvoyer l'email de réinitialisation
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer amélioré */}
      <motion.footer
        className="py-8 px-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            {[
              { href: "/terms", label: "Conditions d'utilisation" },
              { href: "/privacy", label: "Confidentialité" },
              { href: "/support", label: "Support" },
              { href: "/contact", label: "Contact" },
            ].map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.6 + index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 hover:underline"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.0 }}
          >
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Votre Application d'Emploi du Temps. Tous droits réservés.
            </p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
