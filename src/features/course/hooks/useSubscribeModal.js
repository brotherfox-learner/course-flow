import { useState, useCallback } from "react";

/**
 * Subscribe confirmation modal state and handlers
 * @param {string|undefined} courseId - for redirect to payment
 * @param {boolean} isLogin - from auth (TODO: AuthContext)
 * @param {(path: string) => void} push - router.push
 * @returns {{ showConfirmModal: boolean, handleSubscribe: () => void, handleConfirmSubscribe: () => void, handleCancelSubscribe: () => void }}
 */
export function useSubscribeModal(courseId, isLogin, push) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubscribe = useCallback(() => {
    if (isLogin) {
      setShowConfirmModal(true);
    } else {
      push("/login");
    }
  }, [isLogin, push]);

  const handleConfirmSubscribe = useCallback(() => {
    if (courseId) {
      push(`/payment/${courseId}`);
    }
    setShowConfirmModal(false);
  }, [courseId, push]);

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
