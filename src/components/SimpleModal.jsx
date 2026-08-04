export default function SimpleModal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simple-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 id="simple-modal-title" className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            className="rounded px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-4 py-3 text-sm text-slate-800">{children}</div>
      </div>
    </div>
  );
}
