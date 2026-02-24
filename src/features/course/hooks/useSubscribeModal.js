import { useState, useCallback } from "react";

/**
 * Subscribe confirmation modal state and handlers
 * @param {string|undefined} courseSlug - for redirect to payment page (URL uses slug)
 * @param {boolean} isLogin - from auth (TODO: AuthContext)
 * @param {(path: string) => void} push - router.push
 * @returns {{ showConfirmModal: boolean, handleSubscribe: () => void, handleConfirmSubscribe: () => void, handleCancelSubscribe: () => void }}
 */
export function useSubscribeModal(courseSlug, isLogin, push) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubscribe = useCallback(() => {
    if (isLogin) {
      setShowConfirmModal(true);
    } else {
      push("/login");
    }
  }, [isLogin, push]);

  const handleConfirmSubscribe = useCallback(() => {
    if (courseSlug) {
      push(`/payment/${courseSlug}`);
    }
    setShowConfirmModal(false);
  }, [courseSlug, push]);

  const handleCancelSubscribe = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return {
    showConfirmModal,
    handleSubscribe,
    handleConfirmSubscribe,
    handleCancelSubscribe,
  };
}
