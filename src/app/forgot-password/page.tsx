'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (_e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Portal</h1>
          <p className="text-sm text-muted-foreground">Affiliate Marketing Platform</p>
        </div>

        <Card className="border-0 shadow-xl shadow-black/5">
          {sent ? (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  If <span className="font-medium text-foreground">{email}</span> is registered,
                  you&apos;ll receive a password reset link within a few minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground space-y-2">
                <p>The link expires in 1 hour.</p>
                <p>Don&apos;t see it? Check your spam folder.</p>
              </CardContent>
              <CardFooter>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" size="lg" disabled={loading || !email}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>
                  <Link href="/login" className="w-full">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
