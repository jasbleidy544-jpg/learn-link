export function generateInstitutionCode(name: string): string {
  // Tomar primeras 3 letras de cada palabra (máx 2 palabras)
  const words = name.trim().split(' ');
  let prefix = words
    .slice(0, 2)
    .map(w => w.substring(0, 3).toUpperCase())
    .join('-');
  
  // Si el nombre es muy corto, usar "INST" como prefijo
  if (prefix.length < 3) prefix = 'INST';
  
  // Generar sufijo aleatorio de 4 caracteres (letras y números)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${suffix}`;
}