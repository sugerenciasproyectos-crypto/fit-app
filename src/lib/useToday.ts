import { useState } from 'react';
import { madridDay, type Day } from '../domain/dates';

/** Día local (Europe/Madrid) fijado al montar el componente. */
export function useToday(): Day {
  const [today] = useState(() => madridDay(new Date()));
  return today;
}
