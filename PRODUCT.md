# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
React 18 + Vite + TypeScript + Tailwind CSS (PWA instalada en la pantalla de inicio de un iPhone), Supabase como backend. Ver docs/02-TRD.md.

## Users
Un único usuario: el autor (estudiante de 2.º de DAM, en España). Registra lo que come desde su iPhone, a menudo justo antes o después de comer, con prisa y con una sola mano. Peso, pasos y actividad llegan desde Apple Salud (reloj Nothing CMF).

## Product Purpose
Medir lo que come sin suscripción ni funciones innecesarias: diario de comidas por 100 g o 100 ml, porciones caseras, escáner de códigos de barras, favoritos, y un TDEE adaptativo que ajusta el objetivo semanal a partir del peso real. Éxito: registrar al menos 6 de cada 7 días, en menos de 15 s por alimento habitual, con un TDEE que se estabilice en 3–4 semanas.

## Positioning
Una herramienta personal: sin anuncios, sin coach, sin funciones sociales, a 0 €. Combina el registro casero rápido (al estilo de Fitia) con un TDEE adaptativo transparente (al estilo de MacroFactor) que muestra sus cálculos y pide confirmación antes de cambiar el objetivo.

## Operating Context
- Uso diario en el iPhone: varias aperturas cortas al día (en la cocina, en la mesa, en el supermercado) y una revisión semanal del progreso.
- Atajos de iOS sincronizan con Apple Salud.
- Los productos se pueden importar desde un JSON generado con IA, con vista previa editable.

## Capabilities and Constraints
Ver docs/01-PRD.md, docs/02-TRD.md y docs/03-APP-FLOW.md (aprobados). Coste de 0 €, siempre con conexión, un único usuario y textos en español.

## Product Principles
1. Registrar es lo más rápido de la app: un favorito en 2 toques.
2. Los números son la verdad: cada cifra de kcal o del TDEE se puede explicar y nada cambia el objetivo sin confirmación.
3. Nada que no sirva para medir: sin gamificación, rachas ni mensajes motivacionales.
4. Los datos dudosos se señalan (estimado, confianza baja, total parcial), nunca se ocultan.

## Accessibility & Inclusion
WCAG 2.1 AA, objetivos táctiles de 44 px o más, respeto a Dynamic Type y a reducir el movimiento de iOS, y modo oscuro.
