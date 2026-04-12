'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Target, Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (_e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-0 shadow-xl shadow-black/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request a new reset link</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-0 shadow-xl shadow-black/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Password reset!</CardTitle>
          <CardDescription>
            Your password has been updated. Redirecting you to sign in…
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Sign in now</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl shadow-black/5">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password of at least 8 characters.
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
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                autoFocus
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full text-sm">
              Back to sign in
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Portal</h1>
          <p className="text-sm text-muted-foreground">Affiliate Marketing Platform</p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
