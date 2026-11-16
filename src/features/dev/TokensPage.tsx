import { contrast, contrastPairs, palette, type Mode } from '../../ui/tokens/tokens';

function Panel({ mode }: { mode: Mode }) {
  const p = palette[mode];
  return (
    <section
      data-theme={mode}
      className="rounded border border-rule bg-paper p-4 text-ink"
      aria-labelledby={`h-${mode}`}
    >
      <h2 id={`h-${mode}`} className="mb-3 font-mono text-sm uppercase">
        Modo {mode === 'light' ? 'claro' : 'oscuro'}
      </h2>
      <ul className="mb-4 grid grid-cols-3 gap-2">
        {Object.entries(p).map(([name, hex]) => (
          <li key={name} className="text-xs">
            <span className="block h-10 rounded border border-rule" style={{ background: hex }} />
            <span className="num">--{name}</span>
            <br />
            <span className="num text-ink-2">{hex}</span>
          </li>
        ))}
      </ul>
      <table className="num w-full text-xs">
        <tbody>
          {contrastPairs.map(([fg, bg]) => {
            const r = contrast(p[fg], p[bg]);
            return (
              <tr key={`${fg}-${bg}`}>
                <td>
                  {fg} / {bg}
                </td>
                <td className={r < 4.5 ? 'text-alert' : ''}>{r.toFixed(2)}:1</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-4 sm:grid-cols-2">
      <h1 className="sr-only">Tokens de diseño</h1>
      <Panel mode="light" />
      <Panel mode="dark" />
    </main>
  );
}
