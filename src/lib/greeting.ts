export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bom dia, ${firstName}!`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${firstName}!`;
  return `Boa noite, ${firstName}!`;
}
