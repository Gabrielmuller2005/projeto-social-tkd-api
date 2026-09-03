export function converterDataBrParaIso(valor: unknown): string | null {
  if (typeof valor !== "string" || !/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return null;

  const [dia, mes, ano] = valor.split("/");
  const iso = `${ano}-${mes}-${dia}`;

  const data = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso) return null;

  return iso;
}

export function isHoraValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}
