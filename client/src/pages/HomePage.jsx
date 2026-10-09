import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  TrendingUp,
  Target,
  Timer,
  Trophy,
  ArrowRight,
  CheckCircle2,
  BarChart2,
  Sparkles,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageSEO from '../hooks/usePageSEO';

const FAQS = [
  {
    q: 'What entrance examinations does PrepTrack support?',
    a: 'PrepTrack is designed for competitive exam aspirants across CAT, GATE, JEE Main & Advanced, NEET, NIMCET, UPSC CSAT, and Banking exams. You can log sectional tests or full mock exams for Quantitative Aptitude, Logical Reasoning, English, and Computer Science.',
  },
  {
    q: 'How does PrepTrack categorize strong versus weak chapters?',
    a: 'PrepTrack uses an evidence-based analytics engine. If a chapter has at least 3 attempts and an average accuracy below 50%, it is classified as "Needs Improvement". Scores between 50% and 75% become "Developing", while 75%+ with solid question volume are flagged as "Strong". Chapters with fewer than 3 attempts remain "Developing" to prevent misleading conclusions.',
  },
  {
    q: 'Does the study timer keep tracking if I refresh or change tabs?',
    a: 'Yes! PrepTrack features a server-persisted study timer. Every timer start and stop syncs securely with MongoDB, so your focus sessions never reset if you refresh your browser, close a tab, or switch devices.',
  },
  {
    q: 'Can I export my performance reports and mock test history?',
    a: 'Yes, all mock test scorecards, chapter analytics, and study session records can be exported in standardized CSV format for external analysis or offline tracking.',
  },
  {
    q: 'Is my exam data and mock test history private?',
    a: 'Absolutely. Your test scores, chapter weaknesses, and study notes are completely private to your account. Only your opted username and aggregated percentiles are displayed on the competitive peer leaderboard.',
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  usePageSEO({
    title: 'PrepTrack | Entrance Exam Performance Analytics & Mock Test Tracker',
    description:
      'PrepTrack empowers CAT, GATE, JEE, NEET, and NIMCET aspirants with sectional mock test analytics, weak-chapter diagnostic classifiers, and server-persisted study timers.',
    canonicalPath: '/',
    noindex: false,
  });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Structured Data for FAQPage to earn rich snippets on search results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* FAQ Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Navigation */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between"
          aria-label="Main Navigation"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Prep<span className="text-indigo-600 dark:text-indigo-400">Track</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                id="home-nav-dashboard-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  id="home-nav-login-btn"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  id="home-nav-register-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Full-Stack Entrance Exam Performance Analytics Platform
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Turn Mock Test Scores Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-400">
                Exam Mastery
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Record sectional and full mock results, detect your weakest chapters before exam day,
              track authentic study hours with a server-persisted timer, and receive personalized
              study recommendations.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                id="hero-register-btn"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/login"
                id="hero-login-btn"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition shadow-xs"
              >
                Sign In
              </Link>
            </div>

            {/* Value Props Pills */}
            <div className="mt-12 flex flex-wrap justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                CAT, GATE, JEE, NEET & NIMCET Support
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Real Server-Persisted Pomodoro Timer
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Rule-Based Weakness Diagnostic Engine
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section
          className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800/80"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2
                id="features-heading"
                className="text-3xl font-extrabold text-slate-900 dark:text-white"
              >
                Built for Serious Exam Aspirants
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Unlike generic spreadsheet trackers, PrepTrack calculates weighted scores, error rates,
                and chapter mastery trends systematically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center mb-5">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Detailed Mock Test Analytics
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Log chapter tests, sectionals, or full mocks. Track score percentage, accuracy, and
                  attempt rate with automatic math validation and CSV export.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Strength & Weakness Classifier
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Categorizes chapters into Strong, Developing, and Needs Improvement based on minimum
                  evidence thresholds, eliminating premature bias.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 flex items-center justify-center mb-5">
                  <Timer className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Persistent Study Timer
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pomodoro focus sessions survive browser refreshes, prevent duplicate timers, and count
                  authoritative duration against your daily study goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Exam Coverage Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Comprehensive Coverage Across Exam Domains
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Tailored for engineering, management, medical, and postgraduate competitive test series.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { name: 'Quantitative Aptitude', count: '14 Chapters Included', icon: BookOpen },
                { name: 'Logical Reasoning', count: '10 Chapters Included', icon: TrendingUp },
                { name: 'English Language', count: '7 Chapters Included', icon: Award },
                { name: 'Computer Science', count: '8 Chapters Included', icon: ShieldCheck },
              ].map((sub, idx) => {
                const Icon = sub.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
                  >
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub.count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </div>
              <h2
                id="faq-heading"
                className="text-3xl font-extrabold text-slate-900 dark:text-white"
              >
                Everything You Need to Know About PrepTrack
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Answers to common questions regarding mock score logging, analytics, and study timer synchronization.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${
                        openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 py-12 text-slate-500 dark:text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                Prep<span className="text-indigo-600 dark:text-indigo-400">Track</span>
              </span>
              <span className="text-xs text-slate-400 ml-2">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>

            <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Home
              </Link>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Log In
              </Link>
              <Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Register
              </Link>
              <Link to="/forgot-password" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Reset Password
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
