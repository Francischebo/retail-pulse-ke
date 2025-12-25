import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { verifyTOTP } from "@/lib/security/encryption";

interface MFAVerificationProps {
  secret: string;
  onVerified: () => void;
  onCancel?: () => void;
}

export function MFAVerification({ secret, onVerified, onCancel }: MFAVerificationProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 30; // seconds

  const handleVerify = async () => {
    if (isLocked) {
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${LOCKOUT_TIME} seconds before trying again`,
        variant: "destructive",
      });
      return;
    }

    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyTOTP(secret, code);

      if (isValid) {
        toast({
          title: "Verified",
          description: "Two-factor authentication successful",
        });
        onVerified();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
          }, LOCKOUT_TIME * 1000);
          
          toast({
            title: "Account Locked",
            description: `Too many failed attempts. Try again in ${LOCKOUT_TIME} seconds.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid Code",
            description: `Incorrect code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
            variant: "destructive",
          });
        }
        setCode("");
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Could not verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isVerifying && !isLocked) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Too many failed attempts. Please wait before trying again.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Authentication Code</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl tracking-widest font-mono"
              disabled={isLocked}
              autoFocus
            />
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isVerifying || code.length !== 6 || isLocked}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full"
              disabled={isVerifying}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>
            Open your authenticator app to view your verification code.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MFAVerification;
