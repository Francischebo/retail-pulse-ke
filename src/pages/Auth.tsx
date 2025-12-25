import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import MFASetup from "@/components/auth/MFASetup";
import MFAVerification from "@/components/auth/MFAVerification";
import { generateDeviceFingerprint } from "@/lib/security/encryption";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address").max(255);
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkMFAStatus(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        checkMFAStatus(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkMFAStatus = async (session: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.user_metadata?.mfa_enabled) {
      // User has MFA enabled, need verification
      setMfaSecret(user.user_metadata.mfa_secret || '');
      setPendingSession(session);
      setShowMFAVerification(true);
    } else {
      // No MFA, proceed directly
      navigate("/admin");
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      errors.email = emailResult.error.issues[0].message;
    }

    if (!isLogin) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        errors.password = passwordResult.error.issues[0].message;
      }

      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        errors.fullName = nameResult.error.issues[0].message;
      }
    } else {
      if (password.length < 1) {
        errors.password = "Password is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const deviceFingerprint = generateDeviceFingerprint();

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;

        // Log the login event (fire and forget)
        try {
          await supabase.rpc('log_audit_event', {
            p_action: 'user_login' as const,
            p_entity_type: 'user',
            p_entity_id: data.user?.id,
            p_metadata: { device_fingerprint: deviceFingerprint },
          });
        } catch {
          // Silently fail audit log
        }

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });

        // MFA check is handled in checkMFAStatus via onAuthStateChange
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account, or set up MFA for enhanced security.",
        });
        
        // Show MFA setup for new users
        setShowMFASetup(true);
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during authentication";
      
      // Handle specific error types securely (don't leak info)
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please verify your email before logging in";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists";
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    navigate("/admin");
  };

  const handleMFAVerified = () => {
    setShowMFAVerification(false);
    navigate("/admin");
  };

  // Render MFA Setup
  if (showMFASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <MFASetup 
          userEmail={email} 
          onComplete={handleMFASetupComplete}
          onSkip={() => navigate("/admin")}
        />
      </div>
    );
  }

  // Render MFA Verification
  if (showMFAVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <MFAVerification 
          secret={mfaSecret} 
          onVerified={handleMFAVerified}
          onCancel={() => {
            setShowMFAVerification(false);
            supabase.auth.signOut();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src={new URL('../assets/molabs-logo.png', import.meta.url).href} alt="Molabs Tech Solutions" className="h-16" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Sign in to access your dashboard" : "Sign up for a 15-day free trial"}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secured with encryption</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setValidationErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  required={!isLogin}
                  className={validationErrors.fullName ? 'border-destructive' : ''}
                />
                {validationErrors.fullName && (
                  <p className="text-xs text-destructive">{validationErrors.fullName}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                required
                autoComplete="email"
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors(prev => ({ ...prev, password: '' }));
                  }}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className={validationErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-destructive">{validationErrors.password}</p>
              )}
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Must be 8+ chars with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setValidationErrors({});
              }}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
