/**
 * Ladeanzeige für kundenseitige Seiten.
 * Nimmt ungefähr die Fläche der späteren Inhalte ein, damit beim Einblenden
 * kein Layoutsprung entsteht.
 */
export default function Loading() {
  return (
    <div className="container-shop py-12 md:py-16">
      <span className="sr-only" role="status">
        Inhalte werden geladen …
      </span>

      <div className="mb-10 flex flex-col gap-4">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton h-4 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col border border-line bg-charcoal">
            <div className="skeleton aspect-4/5" />
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-6 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
