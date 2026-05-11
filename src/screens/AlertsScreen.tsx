import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert as RNAlert, Linking, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, Alert as StoreAlert } from '../store';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function AlertsScreen({ navigation }: Props) {
  const { alerts, boxes, vetNumber, clearAlerts, removeAlert } = useStore();
  const [selectedAlert, setSelectedAlert] = useState<StoreAlert | null>(null);

  const getBoxName = (boxId: string) => {
    const b = boxes.find(b => b.id === boxId);
    return b ? b.label : 'Inconnu';
  };

  const handleAlertClick = (item: StoreAlert) => {
    setSelectedAlert(item);
  };

  const handleAction = (action: 'view' | 'call' | 'cancel') => {
    if (!selectedAlert) return;

    if (action === 'view') {
      const boxId = selectedAlert.boxId;
      setSelectedAlert(null);
      navigation.navigate('LiveView', { boxId });
    } else if (action === 'call') {
      if (!vetNumber) {
        setSelectedAlert(null);
        RNAlert.alert(
          "Numéro manquant",
          "Aucun numéro de vétérinaire n'est configuré pour cette écurie.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Configurer", onPress: () => navigation.navigate('Settings' as any) }
          ]
        );
        return;
      }
      Linking.openURL(`tel:${vetNumber}`);
      setSelectedAlert(null);
    } else if (action === 'cancel') {
      removeAlert(selectedAlert.id);
      setSelectedAlert(null);
    }
  };

  const renderItem = ({ item }: { item: StoreAlert }) => {
    const isCritical = item.type === 'Jument couchée' || item.type === 'Poche visible';
    const date = new Date(item.timestamp);
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    return (
      <TouchableOpacity 
        style={[styles.alertCard, isCritical && styles.alertCardCritical]}
        onPress={() => handleAlertClick(item)}
      >
        <View style={[styles.iconContainer, isCritical ? styles.iconCritical : styles.iconWarning]}>
          <Ionicons name={isCritical ? "warning" : "alert"} size={32} color={theme.colors.text} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>{item.type}</Text>
            <Text style={styles.alertTime}>{timeString}</Text>
          </View>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <Text style={styles.alertBox}>Box : {getBoxName(item.boxId)}</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique des Alertes</Text>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={clearAlerts} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.secondary} />
          <Text style={styles.emptyText}>Aucune alerte récente.</Text>
          <Text style={styles.emptySubtext}>Tout est calme dans l'écurie.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Custom Action Modal */}
      <Modal
        visible={!!selectedAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedAlert(null)} />
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <Text style={styles.modalTitle}>Action requise</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAlert.type} détectée sur le {getBoxName(selectedAlert.boxId)}
                </Text>

                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleAction('view')}
                >
                  <Ionicons name="videocam" size={24} color={theme.colors.text} style={{ marginRight: 12 }} />
                  <Text style={styles.modalButtonText}>Voir le flux vidéo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.colors.warning }]}
                  onPress={() => handleAction('call')}
                >
                  <Ionicons name="call" size={24} color={theme.colors.text} style={{ marginRight: 12 }} />
                  <Text style={styles.modalButtonText}>Appeler le Véto</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.colors.danger }]}
                  onPress={() => handleAction('cancel')}
                >
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.text} style={{ marginRight: 12 }} />
                  <Text style={styles.modalButtonText}>Tout est OK (Annuler l'alerte)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setSelectedAlert(null)}
                >
                  <Text style={styles.modalCancelText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  clearButton: {
    padding: theme.spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  clearButtonText: {
    color: theme.colors.primaryActive,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100, // Large touch target
  },
  alertCardCritical: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(166, 38, 38, 0.1)', // Subtle red tint
  },
  iconContainer: {
    width: 64, // Larger icon area
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconCritical: {
    backgroundColor: theme.colors.danger,
  },
  iconWarning: {
    backgroundColor: theme.colors.warning,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  alertTime: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
  },
  alertMessage: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    opacity: 0.9,
    marginBottom: 8,
  },
  alertBox: {
    color: theme.colors.primaryActive,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
    marginTop: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    minHeight: 64, // Large target
  },
  modalButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  modalCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    minHeight: 64,
  },
  modalCancelText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
});
