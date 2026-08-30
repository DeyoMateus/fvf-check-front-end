export function formatUserRole(role?: string): string {
  const rolesMap: Record<string, string> = {
    SUPER_ADMIN: "Super Administrador",
    ADMIN: "Administrador / Gerente",
    ANALYST: "Analista Operacional",
    ASSEMBLER: "Montador de Campo",
  };

  return role ? rolesMap[role] || role : "Operador";
}
