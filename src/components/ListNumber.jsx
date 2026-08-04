/** Display position number (1, 2, 3…) on queue and list rows. */
export default function ListNumber({ n, className = '' }) {
  return (
    <span
      className={`mr-2 inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ${className}`}
      aria-hidden
    >
      {n}
    </span>
  );
}
