"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarCheck, Loader2, ArrowRight, Shield, Clock, Users, CheckCircle, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Définition du schéma de validation avec Zod
const formSchema = z.object({
  email: z.string().min(1, { message: "L'email est requis." }).email({ message: "L'email n'est pas valide." }),
  motDePasse: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
})

type LoginFormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      motDePasse: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || "Une erreur est survenue lors de la connexion.")
        console.error("Erreur de connexion:", data)
        return
      }

      setSuccessMessage("Connexion réussie ! Redirection...")
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push("/dashboard")
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
      title: "Sécurisé",
      description: "Vos données sont protégées avec un chiffrement de niveau bancaire",
    },
    {
      icon: Clock,
      title: "Gain de Temps",
      description: "Automatisez la création de vos emplois du temps en quelques clics",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Travaillez en équipe avec vos collègues en temps réel",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="flex max-w-6xl mx-auto gap-8 relative w-full">
          {/* Éléments décoratifs en arrière-plan */}
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
            <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm relative overflow-hidden">
              {/* Bordure décorative */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10 rounded-2xl" />

              <CardHeader className="text-center pb-8 pt-8 relative">
                <motion.div
                  className="flex justify-center mb-6"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                    <CalendarCheck className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Bon retour !</CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    Connectez-vous pour accéder à votre espace de gestion
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="px-8 pb-8 relative">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Champ Email */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="email" className="text-gray-700 font-semibold">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="votre.email@example.com"
                                {...field}
                                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Champ Mot de Passe */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="motDePasse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="motDePasse" className="text-gray-700 font-semibold">
                              Mot de passe
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  id="motDePasse"
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  placeholder="••••••••"
                                  {...field}
                                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200 bg-white/80 pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                                >
                                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Messages d'erreur ou de succès */}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm"
                      >
                        <span className="block sm:inline">{errorMessage}</span>
                      </motion.div>
                    )}
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-sm"
                      >
                        <span className="block sm:inline">{successMessage}</span>
                      </motion.div>
                    )}

                    {/* Bouton de soumission */}
                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] relative overflow-hidden cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          <>
                            Se connecter
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                        {/* Effet de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                      </Button>
                    </motion.div>
                  </form>
                </Form>

                {/* Liens supplémentaires */}
                <motion.div variants={itemVariants} className="mt-8 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200 cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </Link>
                  <p className="mt-4 text-gray-600">
                    Pas encore de compte ?{" "}
                    <Link
                      href="/register"
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors duration-200 cursor-pointer"
                    >
                      S'inscrire gratuitement
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
            <Card className="h-full shadow-2xl rounded-2xl border-0 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
              {/* Pattern de fond */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

              {/* Grille d'emploi du temps stylisée */}
              <div className="absolute inset-0 opacity-10">
                {/* Lignes horizontales */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-white" style={{ top: `${15 + i * 10}%` }} />
                ))}
                {/* Lignes verticales */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-white" style={{ left: `${15 + i * 15}%` }} />
                ))}
              </div>

              <CardContent className="p-8 h-full flex flex-col justify-center relative z-10">
                <motion.div variants={itemVariants} className="text-white mb-8">
                  <h2 className="text-3xl font-bold mb-4">Gérez vos emplois du temps comme un pro</h2>
                  <p className="text-xl text-blue-100 leading-relaxed">
                    Simplifiez la planification de vos cours avec notre plateforme intuitive et moderne.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4 mb-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="p-6 bg-green-500/20 rounded-xl border border-green-400/30"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-300" />
                    <span className="font-semibold text-lg text-white">Essai gratuit 14 jours</span>
                  </div>
                  <p className="text-green-100 text-sm">
                    Découvrez toutes nos fonctionnalités sans engagement. Aucune carte bancaire requise.
                  </p>
                </motion.div>
              </CardContent>

              {/* Éléments flottants animés */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute w-16 h-16 bg-white/5 rounded-full"
                  style={{ top: "20%", right: "15%" }}
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
                  style={{ bottom: "30%", left: "20%" }}
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
