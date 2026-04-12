import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users, DollarSign, Award, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Partner Program — Partner Portal',
  description: 'Join the UPE Partner Program and earn recurring commissions for every merchant you refer. Start at 15%, grow to 25%.',
};

const TIERS = [
  {
    name: 'Bronze',
    rate: '15%',
    threshold: 'Start here',
    color: 'from-amber-700 to-amber-500',
    border: 'border-amber-500/30',
    badge: 'bg-amber-900/30 text-amber-400',
    merchants: '1–9 active merchants',
  },
  {
    name: 'Silver',
    rate: '20%',
    threshold: '10 merchants',
    color: 'from-slate-400 to-slate-300',
    border: 'border-slate-400/40',
    badge: 'bg-slate-700/40 text-slate-300',
    merchants: '10–24 active merchants',
    highlight: true,
  },
  {
    name: 'Gold',
    rate: '25%',
    threshold: '25 merchants',
    color: 'from-yellow-500 to-yellow-300',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-900/30 text-yellow-400',
    merchants: '25+ active merchants',
  },
];

const HOW_IT_WORKS = [
  { icon: Users, step: '01', title: 'Register as a Partner', body: 'Create your partner account and get your unique referral link in minutes.' },
  { icon: Zap, step: '02', title: 'Share Your Link', body: 'Share your referral link with merchants — on your blog, social, email, or direct.' },
  { icon: TrendingUp, step: '03', title: 'Merchants Sign Up', body: 'When a merchant registers via your link and activates their account, you earn.' },
  { icon: DollarSign, step: '04', title: 'Earn Every Month', body: 'Collect recurring commission for as long as the merchant stays active. No cap.' },
];

const BENEFITS = [
  'Recurring lifetime commission — earn monthly, not once',
  'Auto-tier upgrades — hit 10 merchants, earn 20% automatically',
  'Real-time earnings dashboard with payout tracking',
  '90-day attribution window — get credit even if merchants take time to decide',
  'Monthly payouts on the 15th — no minimum holdups',
  'Dedicated partner support and resources',
];

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Partner Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm mb-8">
            <Award className="w-4 h-4" />
            Tiered Partner Program — up to 25% recurring
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Earn Recurring Commission<br />
            <span className="text-emerald-400">for Every Merchant You Refer</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            Join the UPE Partner Program and earn 15–25% recurring commission
            on every merchant you refer — for the lifetime of their account.
            The more you refer, the more you earn.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 px-8">
                Start Earning <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#tiers">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 gap-2 px-8">
                View Commission Tiers
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/2 px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Up to 25%', label: 'Recurring commission' },
            { value: '90 days', label: 'Attribution window' },
            { value: 'Monthly', label: 'Payout on the 15th' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-emerald-400 mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section id="tiers" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Commission Tiers</h2>
            <p className="text-gray-400 text-lg">
              Start at 15% and automatically unlock higher rates as you grow your partner book.
              No applications, no negotiations — promotions happen automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border ${tier.border} bg-white/3 p-8 ${tier.highlight ? 'ring-2 ring-emerald-500/40' : ''}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${tier.badge} mb-6`}>
                  {tier.name}
                </div>
                <div className={`text-5xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent mb-2`}>
                  {tier.rate}
                </div>
                <div className="text-gray-400 text-sm mb-4">recurring commission</div>
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="text-sm text-gray-300">{tier.merchants}</div>
                  <div className="text-xs text-gray-500">Unlocks at: {tier.threshold}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Tier upgrades are automatic — when your 10th active merchant activates, you move to Silver immediately.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 bg-white/2 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-xs font-mono text-emerald-600 mb-2">{step}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Everything You Need to Build a Real Income</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                We built this program for partners who are serious about building recurring revenue,
                not one-off bonuses.
              </p>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                  Apply as a Partner <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <ul className="space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 bg-emerald-950/30 border-t border-emerald-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-gray-400 mb-8">
            Register your partner account today. Your first referral link is ready in under 2 minutes.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 px-10">
              Create Partner Account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="mt-4 text-gray-600 text-sm">
            Already a partner?{' '}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Partner Portal
          </div>
          <div>© {new Date().getFullYear()} UPEmaster. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
