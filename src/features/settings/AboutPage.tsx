import { Link } from 'react-router';
import { SectionTitle } from '../../ui/primitives';

/** D11 Acerca de y atribuciones (TRD §6.1: atribución ODbL visible). */
export default function AboutPage() {
  return (
    <div className="grid gap-5 py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="num text-2xl">Acerca de</h1>
        <Link to="/ajustes" className="text-action underline">
          Ajustes
        </Link>
      </header>
      <p>App personal de registro de calorías con objetivo adaptativo.</p>
      <section className="grid gap-2 text-sm">
        <SectionTitle>Fuentes de datos</SectionTitle>
        <p>
          Datos de productos de{' '}
          <a
            className="text-action underline"
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Food Facts
          </a>
          , disponibles bajo la{' '}
          <a
            className="text-action underline"
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noreferrer"
          >
            Open Database License (ODbL)
          </a>
          . Los contenidos individuales están bajo la Database Contents License.
        </p>
        <p>
          Datos de alimentos genéricos de{' '}
          <a
            className="text-action underline"
            href="https://fdc.nal.usda.gov"
            target="_blank"
            rel="noreferrer"
          >
            USDA FoodData Central
          </a>{' '}
          (dominio público, CC0). El catálogo de partida usa valores aproximados basados en esta
          fuente.
        </p>
      </section>
      <section className="grid gap-2 text-sm">
        <SectionTitle>Licencia</SectionTitle>
        <p>Copyright © 2026 Marco Calero Gallego. Todos los derechos reservados.</p>
      </section>
    </div>
  );
}
