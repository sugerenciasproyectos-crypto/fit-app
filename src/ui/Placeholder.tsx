export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="py-4">
      <h1 className="num text-2xl">{title}</h1>
      <p className="mt-6 text-center text-ink-2">— pendiente —</p>
    </div>
  );
}
