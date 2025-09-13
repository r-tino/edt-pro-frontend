// app/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  Clock,
  Users,
  Settings,
  ChevronRight,
  CalendarCheck,
  Star,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { motion, easeOut, easeInOut } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export default function LandingPage() {
  const features = [
    {
      icon: Settings,
      title: "Gestion Intuitive",
      description: "Interface simple et intuitive pour gérer tous vos emplois du temps en quelques clics.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Calendar,
      title: "Calendrier Clair",
      description: "Visualisez vos cours et séances dans un calendrier moderne et facile à lire.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Clock,
      title: "Accès Facile",
      description: "Accédez à vos horaires depuis n'importe quel appareil, à tout moment.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Rôles Personnalisés",
      description: "Gérez différents types d'utilisateurs avec des permissions adaptées à chaque rôle.",
      color: "from-orange-500 to-red-500",
    },
  ]

  const stats = [
    { number: "10K+", label: "Utilisateurs Actifs", icon: Users },
    { number: "99.9%", label: "Temps de Disponibilité", icon: Shield },
    { number: "24/7", label: "Support Client", icon: Zap },
    { number: "4.9/5", label: "Note Moyenne", icon: Star },
  ]

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: easeOut,
      },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: easeInOut,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5 hover:shadow-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/25">
                  <CalendarCheck className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                  EDT
                </span>
                <p className="text-xs text-gray-500 font-semibold -mt-1 tracking-wider">PRO</p>
              </div>
              <div className="hidden md:block px-4">
                <h1 className="text-lg font-semibold text-gray-800">Votre Application d'Emploi du Temps</h1>
                <p className="text-sm text-gray-600 -mt-1">Gestion moderne et intuitive</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-blue-600 font-semibold px-8 py-5 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-transparent hover:border-blue-200/50 hover:shadow-md cursor-pointer"
                  >
                    Se Connecter
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold px-10 py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 border border-blue-500/20 cursor-pointer">
                    <span className="flex items-center">
                      S'inscrire
                      <Sparkles className="ml-2 w-4 h-4" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-12 lg:py-15">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div className="text-center" initial="hidden" animate="visible" variants={containerVariants}>
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold shadow-lg shadow-blue-500/10 border border-blue-200/50">
                <Sparkles className="w-4 h-4 mr-2" />
                Nouveau : Interface redesignée !
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight shadow-sm"
              variants={itemVariants}
            >
              Révolutionnez votre{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Gestion du Temps
              </span>{" "}
              Scolaire
            </motion.h1>

            <motion.p
              className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed shadow-sm"
              variants={itemVariants}
            >
              Une plateforme moderne et intuitive pour gérer vos emplois du temps, enseignants, salles et matières.
              Simplifiez votre organisation avec des outils puissants et une interface élégante.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              variants={itemVariants}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-10 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 cursor-pointer"
                  >
                    Commencer Gratuitement
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 px-10 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl bg-white/80 backdrop-blur-sm cursor-pointer"
                >
                  Voir la Démo
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
              variants={containerVariants}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center"
                >
                  <div className="bg-white/80 backdrop-blur-sm cursor-pointer rounded-2xl p-6 shadow-xl shadow-black/5 border border-white/20 hover:shadow-2xl transition-all duration-300">
                    <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gradient-to-b from-transparent to-white/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6" variants={itemVariants}>
              Fonctionnalités{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Exceptionnelles
              </span>
            </motion.h2>
            <motion.p className="text-xl text-gray-600 max-w-3xl mx-auto" variants={itemVariants}>
              Découvrez les outils innovants qui transformeront votre façon de gérer les emplois du temps
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="h-full bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm hover:bg-white transition-all duration-300 border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl shadow-black/5 hover:shadow-black/10 rounded-2xl overflow-hidden group transform hover:scale-105">
                  <CardContent className="p-8 text-center relative cursor-pointer">
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl"
                      style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                    />

                    <motion.div
                      className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10 group-hover:shadow-2xl transition-all duration-300`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      variants={floatingVariants}
                      animate="animate"
                    >
                      <feature.icon className="h-10 w-10 text-white" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
            <motion.h2 className="text-4xl lg:text-5xl font-bold text-white mb-8" variants={itemVariants}>
              Prêt à Transformer votre Organisation ?
            </motion.h2>
            <motion.p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto" variants={itemVariants}>
              Rejoignez des milliers d'établissements qui ont déjà révolutionné leur gestion du temps
            </motion.p>
            <motion.div variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-white text-blue-700 hover:bg-gray-50 px-12 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl border-2 border-white/20 hover:border-white/40 transform hover:scale-105 cursor-pointer"
                  >
                    Démarrer Maintenant
                    <ChevronRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center">
            <motion.div
              className="flex items-center justify-center space-x-3 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EDT Pro
              </span>
            </motion.div>

            <motion.p
              className="text-gray-400 mb-8 text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              © 2025 EDT Pro. Tous droits réservés. Fait avec ❤️ pour l'éducation.
            </motion.p>

            <motion.div
              className="flex justify-center space-x-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {["Confidentialité", "Conditions", "Support", "À propos"].map((link, index) => (
                <Link
                  key={index}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200 font-medium hover:underline underline-offset-4"
                >
                  {link}
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  )
}
