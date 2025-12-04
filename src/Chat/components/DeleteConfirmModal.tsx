import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useTranslation, type Language } from '../hooks/useTranslation';

/**
 * Props for the DeleteConfirmModal component
 */
interface DeleteConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Title of the session being deleted */
  sessionTitle: string;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Callback when delete is cancelled */
  onCancel: () => void;
  /** Language for the interface */
  language?: Language;
  /** Whether the delete operation is in progress */
  isDeleting?: boolean;
}

/**
 * DeleteConfirmModal component that provides a nice confirmation dialog
 * for deleting conversations
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  sessionTitle,
  onConfirm,
  onCancel,
  language = 'en',
  isDeleting = false
}) => {
  const { t } = useTranslation(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-lg sm:rounded-lg shadow-2xl max-w-md w-full mx-2 sm:mx-4 max-h-[calc(100dvh-2rem)] overflow-hidden">
        {/* Header */}
        <div className="bg-destructive p-4 sm:p-6 text-destructive-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6 text-destructive-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold truncate">{t('deleteModal.title')}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm truncate">{t('deleteModal.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-xl transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={20} className="sm:w-6 sm:h-6 text-destructive" />
            </div>

            <div>
              <p className="text-card-foreground text-base sm:text-lg font-medium">
                {t('deleteModal.confirmText')}
              </p>
              <div className="mt-2 p-2 sm:p-3 bg-muted rounded-xl">
                <p className="text-foreground font-medium text-sm truncate">
                  "{sessionTitle}"
                </p>
              </div>
            </div>

            <div className="bg-destructive text-destructive-foreground border border-destructive rounded-xl p-2 sm:p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle size={14} className="sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-left">
                  {t('deleteModal.warning')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-muted px-4 sm:px-6 py-3 sm:py-4 flex space-x-2 sm:space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 bg-background border border-border text-foreground font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-xl hover:bg-muted transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-base"
          >
            {t('deleteModal.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-destructive hover:bg-destructive text-destructive-foreground font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base shadow-md hover:shadow-lg"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-destructive-foreground border-t-destructive-foreground rounded-full animate-spin" />
                <span>{t('deleteModal.deleting')}</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{t('deleteModal.delete')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
