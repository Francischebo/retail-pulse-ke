import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  full_name: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional(),
  roles: z.array(z.enum(["admin", "manager", "cashier"])).min(1, "Select at least one role"),
});

interface UserFormProps {
  user?: any;
  onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    roles: user?.roles || [],
  });
  const { toast } = useToast();

  const availableRoles = [
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "cashier", label: "Cashier" },
  ];

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = userSchema.parse(formData);

      if (user?.id) {
        // Update existing user
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: validatedData.full_name,
            phone: validatedData.phone || null,
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Update roles
        // First, delete existing roles
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        // Then insert new roles
        const roleInserts = validatedData.roles.map((role) => ({
          user_id: user.id,
          role,
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (rolesError) throw rolesError;

        toast({
          title: "User updated",
          description: "User roles and information have been updated successfully.",
        });
      } else {
        // Create new user - this requires admin privileges
        // Note: User creation needs to be done via Supabase admin API or Auth
        toast({
          title: "Feature unavailable",
          description: "User creation requires admin dashboard access. Please create users through authentication flow.",
          variant: "destructive",
        });
        return;
      }

      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving user",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user ? "Manage User Roles" : "Add New User"}</CardTitle>
        <CardDescription>
          {user ? "Update user roles and permissions" : "Create a new user account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={!!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!user}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles & Permissions *</Label>
            <div className="space-y-3 border rounded-lg p-4">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.roles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <Label htmlFor={role.value} className="cursor-pointer">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Admin: Full system access | Manager: Product & sales management | Cashier: POS operations
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? "Update User Roles" : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
