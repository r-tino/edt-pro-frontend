"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Users, Settings, ChevronRight, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LandingPage() {
  const features = [
    {
      icon: Settings,
      title: "Gestion Intuitive",
      description: "Interface simple et intuitive pour gérer tous vos emplois du temps en quelques clics.",
    },
    {
      icon: Calendar,
      title: "Calendrier Clair",
      description: "Visualisez vos cours et séances dans un calendrier moderne et facile à lire.",
    },
    {
      icon: Clock,
      title: "Accès Facile",
      description: "Accédez à vos horaires depuis n'importe quel appareil, à tout moment.",
    },
    {
      icon: Users,
      title: "Rôles Personnalisés",
      description: "Gérez différents types d'utilisateurs avec des permissions adaptées à chaque rôle.",
    },
  ]

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <CalendarCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    EDT
                  </span>
                  <p className="text-xs text-gray-600 font-medium -mt-1">Pro</p>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-gray-800">Votre Application d'Emploi du Temps</h1>
                <p className="text-sm text-gray-600 -mt-1">Gestion moderne et intuitive</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="relative text-blue-600 hover:text-blue-700 font-semibold px-6 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300 border border-transparent hover:border-blue-200 shadow-sm hover:shadow-md"
              >
                <span className="relative z-10">Se Connecter</span>
              </Button>
              <Button className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-2 rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-600">
                <span className="relative z-10 flex items-center">
                  S'inscrire
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-purple-50 py-20 lg:py-40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%239C92AC fillOpacity=0.03%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative">
          <motion.div className="text-center" initial="hidden" animate="visible" variants={containerVariants}>
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              variants={itemVariants}
            >
              Optimisez votre <span className="text-blue-600">Gestion du Temps</span> Scolaire !
            </motion.h1>
            <motion.p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed" variants={itemVariants}>
              Gérez facilement vos emplois du temps, enseignants, salles et matières. Visualisez vos séances, gérez vos
              cours et restez organisé.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center" variants={itemVariants}>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Se Connecter
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 px-8 py-3 text-lg cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
              >
                S'Inscrire
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" variants={itemVariants}>
              Fonctionnalités Clés
            </motion.h2>
            <motion.p className="text-lg text-gray-600 max-w-2xl mx-auto" variants={itemVariants}>
              Découvrez les outils qui rendront votre gestion d'emploi du temps plus efficace que jamais
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-200 cursor-pointer group shadow-md">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300 shadow-sm">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
            <motion.h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" variants={itemVariants}>
              Prêt à simplifier votre organisation ?
            </motion.h2>
            <motion.p className="text-xl text-blue-100 mb-8" variants={itemVariants}>
              Rejoignez-nous dès maintenant !
            </motion.p>
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105"
              >
                Commencer Maintenant
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CalendarCheck className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-blue-400">EDT</span>
            </div>
            <p className="text-gray-400 mb-6">© 2025 Votre Application. Tous droits réservés.</p>
            <div className="flex justify-center space-x-6">
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer hover:underline"
              >
                Confidentialité
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer hover:underline"
              >
                Termes de Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
