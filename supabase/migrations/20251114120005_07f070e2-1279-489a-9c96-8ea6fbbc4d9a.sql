-- Allow admins to manage user roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Fix customers table to allow insert for authenticated users initially
-- This is a temporary fix until roles are assigned
DROP POLICY IF EXISTS "Admins and managers can manage customers" ON public.customers;

CREATE POLICY "Admins and managers can manage customers" ON public.customers
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'cashier')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'cashier')
  );