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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B31]/35 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        className="w-full max-w-sm rounded-2xl border border-[#FFD1C2] bg-white px-5 py-5 shadow-[0_24px_60px_rgba(50,50,93,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-confirm-title" className="text-xl font-extrabold text-[#2B2B2B]">
          Delete {displayName}?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6F8A91]">
          This removes the {itemType} from your plan. You can add it again later if you need it.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-[#D5E3E6] bg-white px-4 py-2 text-sm font-bold text-[#5DB7C4] transition hover:border-[#5DB7C4] hover:bg-[#EAF7F9]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-xl bg-[#F36C3D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D6532B]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
