"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

/* ANIMATION VARIANTS */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">

      {/* NAVBAR */}
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🍉</span>
          </div>
          <span className="text-2xl font-bold text-gray-800">
            Watermelon Savings
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-4"
        >
          <Link href="/login" className="font-medium text-gray-700 hover:text-gray-900">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-green-500 to-red-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-md transition"
          >
            Sign Up
          </Link>
        </motion.div>
      </nav>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-14 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Automate Your <span className="text-green-600">Savings Group</span>
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Manage savings, loans, and repayments on one secure digital platform.
          </p>

          <div className="flex gap-4">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-green-500 to-red-500 text-white px-7 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center"
            >
              Get Started
              <ArrowRight className="ml-2" size={18} />
            </Link>

            <Link
              href="/demo"
              className="px-7 py-3 rounded-lg font-semibold border border-gray-300 hover:border-gray-400 transition"
            >
              View Demo
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/images/savings1.jpg"
            alt="Savings group"
            width={650}
            height={450}
            priority
            className="rounded-xl shadow-xl object-cover"
          />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-14">
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.15 }}
        >
          <FeatureCard
            image="/images/savings2.jpg"
            title="Easy Setup"
            description="Create and manage your savings group digitally in minutes."
          />
          <FeatureCard
            image="/images/savings3.jpg"
            title="Safe & Secure"
            description="Your data is encrypted and accessible only to authorized users."
          />
          <FeatureCard
            image="/images/savings4.jpg"
            title="Dedicated Support"
            description="Get help whenever you need it from our support team."
          />
        </motion.div>
      </section>

      {/* ABOUT */}
      <section className="container mx-auto px-4 py-14">
        <motion.div
          className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Image
            src="/images/savings3.jpg"
            alt="Digital finance"
            width={550}
            height={380}
            className="rounded-xl shadow-lg object-cover"
          />

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What is Watermelon Savings?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Watermelon Savings is a digital platform built for savings groups,
              microfinance institutions, and lending businesses to manage savings,
              loans, and repayments efficiently across any device.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section
        className="py-16 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/savings4.jpg')" }}
      >
        <motion.div
          className="bg-white/90 max-w-2xl mx-auto p-8 rounded-xl text-center shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Grow Your Savings Group?
          </h2>
          <p className="text-gray-600 mb-6">
            Join modern savings groups already using Watermelon Savings.
          </p>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-green-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Get Started Now
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Watermelon Savings. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* FEATURE CARD */
function FeatureCard({
  image,
  title,
  description,
}: {
  image: string
  title: string
  description: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
    >
      <Image
        src={image}
        alt={title}
        width={400}
        height={220}
        className="w-full h-44 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </motion.div>
  )
}
