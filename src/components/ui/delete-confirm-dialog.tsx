interface DeleteConfirmDialogProps {
  itemName: string;
  itemType: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  itemName,
  itemType,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const displayName = itemName.trim() || `this ${itemType}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#12263A]/35 px-4"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        className="w-full max-w-sm rounded-2xl border border-[#D9B2A8] bg-white px-5 py-5 shadow-[0_24px_60px_rgba(50,50,93,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-confirm-title" className="text-xl font-extrabold text-[#2B2B2B]">
          Delete {displayName}?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#65777D]">
          This removes the {itemType} from your plan. You can add it again later if you need it.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-[#D4DDE0] bg-white px-4 py-2 text-sm font-bold text-[#2F6F7A] transition hover:border-[#2F6F7A] hover:bg-[#EFF4F5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-xl bg-[#A65A3F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8F4D38]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
