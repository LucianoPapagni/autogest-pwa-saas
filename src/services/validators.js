// Sanitizadores en tiempo real para bloquear teclas inválidas en los inputs
export const sanitizeOnlyLetters = (val) =>
  val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']/g, '').slice(0, 60);

export const sanitizeOnlyDigits = (val, maxLen = 8) =>
  val.replace(/\D/g, '').slice(0, maxLen);

export const sanitizePhone = (val) =>
  val.replace(/[^\d+\s-]/g, '').slice(0, 20);

export const sanitizePlate = (val) =>
  val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

// Estándar ISO 3779: El VIN nunca utiliza las letras I, O, Q
export const sanitizeVin = (val) =>
  val.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);

export const sanitizeTextSpec = (val, maxLen = 40) =>
  val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,/-]/g, '').slice(0, maxLen);

// Validadores de envío de formularios
export function validateClientData({ nombre_completo, dni, telefono, email }) {
  const cleanName = (nombre_completo || '').trim();
  if (cleanName.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/.test(cleanName)) {
    return 'El nombre y apellido debe tener al menos 3 letras y no contener números.';
  }

  const cleanDni = (dni || '').trim();
  if (!/^\d{7,8}$/.test(cleanDni)) {
    return 'El DNI argentino debe contener únicamente números y tener entre 7 y 8 dígitos.';
  }

  const phoneDigits = (telefono || '').replace(/\D/g, '');
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    return 'El teléfono debe contener entre 8 y 15 dígitos numéricos (ej: 2615550101).';
  }

  const cleanEmail = (email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return 'Ingresa un correo electrónico con formato válido.';
  }

  return null;
}

export function validateVehicleData({ cliente_id, patente, vin, marca, modelo, motorizacion, kilometraje }, existingVehicles = []) {
  if (!cliente_id) {
    return 'Debes seleccionar un cliente titular para vincular el vehículo.';
  }

  const cleanPlate = (patente || '').trim().toUpperCase();
  // Mercosur (AA123BB), Argentina clásico (ABC123), Motos Mercosur (A123BCD) o Internacional (5 a 8 alfanumérico con letras y números)
  const isMercosur = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleanPlate);
  const isClassicArg = /^[A-Z]{3}\d{3}$/.test(cleanPlate);
  const isMotoArg = /^\d{3}[A-Z]{3}$|^[A-Z]\d{3}[A-Z]{3}$/.test(cleanPlate);
  const isInternational = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,8}$/.test(cleanPlate);

  if (!isMercosur && !isClassicArg && !isMotoArg && !isInternational) {
    return 'Patente inválida. Usa formato Mercosur (AF123BC), tradicional (ABC123) o internacional (5 a 8 caracteres con letras y números).';
  }

  const duplicate = existingVehicles.some((v) => v.patente.toUpperCase() === cleanPlate);
  if (duplicate) {
    return `La patente ${cleanPlate} ya se encuentra registrada en este taller.`;
  }

  const cleanVin = (vin || '').trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{8,17}$/.test(cleanVin)) {
    return 'El VIN / Chasis debe tener entre 8 y 17 caracteres alfanuméricos (sin letras I, O, Q).';
  }

  if ((marca || '').trim().length < 2) {
    return 'La marca del vehículo debe tener al menos 2 caracteres.';
  }

  if ((modelo || '').trim().length < 1) {
    return 'Ingresa el modelo del vehículo.';
  }

  if ((motorizacion || '').trim().length < 2) {
    return 'Especifica la motorización del vehículo (ej: 2.8L TDI o 1.6 Nafta).';
  }

  const km = Number(kilometraje);
  if (!Number.isInteger(km) || km < 0 || km > 2000000) {
    return 'El kilometraje debe ser un número entero entre 0 y 2.000.000 km.';
  }

  return null;
}

export function validateWorkOrderData({ vehiculo_id, diagnostico, costo_mano_obra, dias_preventivo }) {
  if (!vehiculo_id) {
    return 'Selecciona un vehículo válido para la Orden de Trabajo.';
  }

  if ((diagnostico || '').trim().length < 10) {
    return 'El diagnóstico técnico debe ser descriptivo (mínimo 10 caracteres).';
  }

  if (costo_mano_obra !== undefined && costo_mano_obra !== '') {
    const cost = Number(costo_mano_obra);
    if (isNaN(cost) || cost < 0 || cost > 50000000) {
      return 'El costo de mano de obra no puede ser negativo ni exceder el límite permitido.';
    }
  }

  if (dias_preventivo !== undefined && dias_preventivo !== '') {
    const days = Number(dias_preventivo);
    if (!Number.isInteger(days) || days < 7 || days > 1095) {
      return 'El plazo de alerta preventiva debe estar entre 7 y 1095 días (3 años).';
    }
  }

  return null;
}

export function validateSparePart({ nombre, costo, vida_util_meses }) {
  if ((nombre || '').trim().length < 3) {
    return 'El nombre del repuesto debe tener al menos 3 caracteres.';
  }

  const cost = Number(costo);
  if (isNaN(cost) || cost < 0 || cost > 50000000) {
    return 'El costo del repuesto debe ser un monto válido mayor o igual a 0.';
  }

  const months = Number(vida_util_meses);
  if (!Number.isInteger(months) || months < 1 || months > 120) {
    return 'La vida útil estimada del repuesto debe ser entre 1 y 120 meses.';
  }

  return null;
}