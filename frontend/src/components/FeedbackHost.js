import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { registerFeedbackHost } from '../utils/feedback';

const TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;

const TOAST_ICONS = {
  error: 'error-outline',
  success: 'check-circle-outline',
  info: 'info-outline',
};

/**
 * Draws the toasts and confirm dialog requested through utils/feedback.js.
 * Web only: on mobile, feedback.js uses the native Alert instead, so this
 * renders nothing there.
 */
export default function FeedbackHost() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(0);

  useEffect(() => registerFeedbackHost({
    showToast: (toast) => {
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE_TOASTS - 1)), { ...toast, id }]);
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), TOAST_DURATION_MS);
    },
    showConfirm: (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
  }), []);

  if (Platform.OS !== 'web') return null;

  const dismissToast = (id) => setToasts((current) => current.filter((t) => t.id !== id));
  const closeDialog = (confirmed) => {
    dialog?.resolve(confirmed);
    setDialog(null);
  };

  return (
    <>
      <View pointerEvents="box-none" style={styles.toastStack} accessibilityLiveRegion="polite">
        {toasts.map((toast) => (
          <View key={toast.id} style={[styles.toast, styles[toast.type] || styles.info]} accessibilityRole="alert">
            <MaterialIcons name={TOAST_ICONS[toast.type] || TOAST_ICONS.info} size={22} color="#ffffff" style={styles.toastIcon} />
            <View style={styles.toastTextBlock}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => dismissToast(toast.id)} accessibilityRole="button" accessibilityLabel="Dismiss message">
              <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => closeDialog(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog} accessibilityRole="alert">
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            {dialog?.message ? <Text style={styles.dialogMessage}>{dialog.message}</Text> : null}
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={[styles.dialogButton, styles.cancelButton]} onPress={() => closeDialog(false)} accessibilityRole="button">
                <Text style={styles.cancelText}>{dialog?.cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, dialog?.destructive ? styles.destructiveButton : styles.confirmButton]}
                onPress={() => closeDialog(true)}
                accessibilityRole="button"
              >
                <Text style={dialog?.destructive ? styles.destructiveText : styles.confirmText}>{dialog?.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toastStack: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  error: { backgroundColor: '#3b1414', borderColor: '#ef4444' },
  success: { backgroundColor: '#123322', borderColor: '#0df269' },
  info: { backgroundColor: '#15291f', borderColor: 'rgba(13,242,105,0.5)' },
  toastIcon: { marginRight: 10, marginTop: 1 },
  toastTextBlock: { flex: 1, marginRight: 8 },
  toastTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  toastMessage: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2, lineHeight: 18 },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#15291f',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(13,242,105,0.3)',
  },
  dialogTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  dialogMessage: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 8, lineHeight: 20 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  dialogButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  cancelButton: { borderColor: 'rgba(255,255,255,0.2)' },
  confirmButton: { backgroundColor: '#0df269', borderColor: '#0df269' },
  destructiveButton: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
  cancelText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  confirmText: { color: '#102217', fontWeight: 'bold' },
  destructiveText: { color: '#ef4444', fontWeight: 'bold' },
});
