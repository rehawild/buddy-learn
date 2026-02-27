
-- Prevent users from updating their own role
CREATE POLICY "No one can update roles"
  ON public.user_roles FOR UPDATE
  USING (false);

-- Prevent users from deleting their own role
CREATE POLICY "No one can delete roles"
  ON public.user_roles FOR DELETE
  USING (false);
