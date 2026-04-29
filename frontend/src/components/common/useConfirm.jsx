import { useState, useCallback } from 'react';

/**
 * Returns { confirm, ConfirmModal }.
 * Call `await confirm(message, options?)` — resolves to true (confirmed) or false (cancelled).
 * Render `{ConfirmModal}` somewhere in the component tree.
 *
 * Options: { title?: string, confirmLabel?: string }
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({ message, resolve, ...options });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const ConfirmModal = state ? (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mt-0.5">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800">
                {state.title || 'Confirm Delete'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{state.message}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-sm"
          >
            {state.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { ConfirmModal, confirm };
}
