import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Copy, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTOTPSecret, generateTOTPUri, verifyTOTP } from "@/lib/security/encryption";
import { supabase } from "@/integrations/supabase/client";

interface MFASetupProps {
  userEmail: string;
  onComplete: () => void;
  onSkip?: () => void;
}

export function MFASetup({ userEmail, onComplete, onSkip }: MFASetupProps) {
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Generate new TOTP secret
    const newSecret = generateTOTPSecret();
    setSecret(newSecret);
    
    // Generate QR code URL using Google Charts API
    const totpUri = generateTOTPUri(newSecret, userEmail, 'MolabsPOS');
    const encodedUri = encodeURIComponent(totpUri);
    setQrCodeUrl(`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodedUri}&choe=UTF-8`);
  }, [userEmail]);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy secret",
        variant: "destructive",
      });
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const isValid = await verifyTOTP(secret, verificationCode);
      
      if (isValid) {
        // Store the MFA secret securely in the database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update user metadata with MFA enabled flag
          await supabase.auth.updateUser({
            data: {
              mfa_enabled: true,
              mfa_secret_hash: await hashSecret(secret), // Store hash only
            }
          });
        }
        
        setIsVerified(true);
        toast({
          title: "MFA Enabled",
          description: "Two-factor authentication is now active",
        });
        
        setTimeout(onComplete, 1500);
      } else {
        toast({
          title: "Invalid Code",
          description: "The code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Simple hash for storing secret indicator
  const hashSecret = async (s: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(s);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>Enable Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isVerified ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600">MFA Enabled Successfully!</h3>
            <p className="text-muted-foreground mt-2">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </AlertDescription>
            </Alert>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-4">
              {qrCodeUrl && (
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}
              
              {/* Manual Entry Option */}
              <div className="w-full space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Or enter this key manually:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">
                  Enter the 6-digit code from your app
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Enable MFA"
                )}
              </Button>

              {onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full"
                >
                  Skip for now
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <Badge variant="outline" className="mb-2">
                Recovery codes will be provided after setup
              </Badge>
              <p>
                Keep your authenticator app secure. You'll need it to log in.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MFASetup;
