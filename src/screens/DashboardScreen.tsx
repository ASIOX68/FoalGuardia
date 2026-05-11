import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert as RNAlert, Modal, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { useStore, Box } from '../store';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { harasName, vetNumber, boxes, alerts, addBox, removeBox } = useStore();
  
  const [isAddBoxModalVisible, setAddBoxModalVisible] = useState(false);
  const [newBoxLabel, setNewBoxLabel] = useState('');
  const [newBoxIp, setNewBoxIp] = useState('');

  const [boxToDelete, setBoxToDelete] = useState<Box | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleIpChange = (text: string) => {
    // Remplacer les virgules par des points (pour clavier iOS)
    let formatted = text.replace(/,/g, '.');
    // Garder uniquement chiffres et points
    formatted = formatted.replace(/[^\d.]/g, '');

    // Si on est en train d'ajouter du texte
    if (formatted.length > newBoxIp.length) {
      const parts = formatted.split('.');
      const lastPart = parts[parts.length - 1];
      // Ajouter automatiquement un point après 3 chiffres (sauf si on est au 4ème bloc)
      if (lastPart.length === 3 && parts.length < 4) {
        formatted += '.';
      }
    }
    
    setNewBoxIp(formatted);
  };

  const criticalAlerts = alerts.filter(a => a.type === 'Jument couchée' || a.type === 'Poche visible');

  const getGlobalStatus = () => {
    if (boxes.length === 0) return { text: "Aucun box", color: theme.colors.textMuted };
    if (criticalAlerts.length > 0) return { text: `${criticalAlerts.length} URGENCE(S)`, color: theme.colors.danger };
    if (alerts.length > 0) return { text: "Activité suspecte", color: theme.colors.warning };
    return { text: "Calme", color: theme.colors.secondary };
  };

  const status = getGlobalStatus();

  const handleCallVet = () => {
    if (!vetNumber) {
      RNAlert.alert(
        "Numéro manquant",
        "Aucun numéro de vétérinaire n'est configuré.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Configurer", onPress: () => navigation.navigate('Settings' as any) }
        ]
      );
      return;
    }
    Linking.openURL(`tel:${vetNumber}`);
  };

  const handleAddBox = () => {
    if (!newBoxLabel.trim() || !newBoxIp.trim()) {
      RNAlert.alert("Erreur", "Le label et l'IP sont obligatoires.");
      return;
    }
    
    addBox({
      id: Math.random().toString(36).substring(7),
      label: newBoxLabel,
      ip: newBoxIp
    });
    
    setNewBoxLabel('');
    setNewBoxIp('');
    setAddBoxModalVisible(false);
  };

  const handleLongPressBox = (box: Box) => {
    setBoxToDelete(box);
    setDeleteConfirmationText('');
  };

  const handleConfirmDelete = () => {
    if (!boxToDelete) return;
    
    if (deleteConfirmationText.trim() === boxToDelete.label) {
      removeBox(boxToDelete.id);
      setBoxToDelete(null);
    } else {
      RNAlert.alert("Erreur", "Le nom saisi ne correspond pas exactement au nom du box.");
    }
  };

  const getBoxStatus = (boxId: string) => {
    const boxAlert = alerts.find(a => a.boxId === boxId);
    if (!boxAlert) return { text: "OK", color: theme.colors.secondary, icon: "checkmark-circle" };
    
    const isCritical = boxAlert.type === 'Jument couchée' || boxAlert.type === 'Poche visible';
    return { 
      text: boxAlert.type, 
      color: isCritical ? theme.colors.danger : theme.colors.warning,
      icon: isCritical ? "warning" : "alert-circle"
    };
  };

  const renderBoxItem = ({ item }: { item: Box }) => {
    const boxStatus = getBoxStatus(item.id);

    return (
      <TouchableOpacity
        style={[styles.boxCard, { borderLeftColor: boxStatus.color, borderLeftWidth: 6 }]}
        onPress={() => navigation.navigate('LiveView', { boxId: item.id })}
        onLongPress={() => handleLongPressBox(item)}
        delayLongPress={500}
      >
        <View style={styles.boxCardHeader}>
          <Text style={styles.boxLabel}>{item.label}</Text>
          <View style={[styles.statusBadge, { backgroundColor: boxStatus.color + '20' }]}>
            <Ionicons name={boxStatus.icon as any} size={16} color={boxStatus.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: boxStatus.color }]}>{boxStatus.text}</Text>
          </View>
        </View>
        <Text style={styles.boxIp}>Caméra: {item.ip}</Text>
        <View style={styles.boxAction}>
           <Text style={styles.boxActionText}>Voir le flux</Text>
           <Ionicons name="chevron-forward" size={16} color={theme.colors.primaryActive} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddBoxCard = () => (
    <TouchableOpacity
      style={styles.addBoxCard}
      onPress={() => setAddBoxModalVisible(true)}
    >
      <Ionicons name="add-circle-outline" size={40} color={theme.colors.primaryActive} />
      <Text style={styles.addBoxText}>Ajouter un Box</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.harasTitle}>{harasName}</Text>
        <View style={styles.globalStatusContainer}>
          <Text style={styles.globalStatusLabel}>Status : </Text>
          <Text style={[styles.globalStatusValue, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleCallVet}>
          <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.warning }]}>
            <Ionicons name="call" size={28} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>Appeler Véto</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('Alerts' as any)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: alerts.length > 0 ? theme.colors.danger : theme.colors.surface }]}>
            <Ionicons name="notifications" size={28} color={alerts.length > 0 ? "#fff" : theme.colors.text} />
            {alerts.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{alerts.length}</Text></View>
            )}
          </View>
          <Text style={styles.quickActionText}>Alertes</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>État des Boxes</Text>
      </View>

      <FlatList
        data={boxes}
        keyExtractor={(item) => item.id}
        renderItem={renderBoxItem}
        ListFooterComponent={renderAddBoxCard}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Box Modal */}
      <Modal
        visible={isAddBoxModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddBoxModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddBoxModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un Box</Text>
            
            <Text style={styles.inputLabel}>Nom du Box</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Box 1"
              placeholderTextColor={theme.colors.textMuted}
              value={newBoxLabel}
              onChangeText={setNewBoxLabel}
            />

            <Text style={styles.inputLabel}>Adresse IP locale</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 192.168.0.11"
              placeholderTextColor={theme.colors.textMuted}
              value={newBoxIp}
              onChangeText={handleIpChange}
              keyboardType="decimal-pad" // decimal-pad gives numbers + comma/dot on iOS
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddBox}>
              <Text style={styles.submitButtonText}>Ajouter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddBoxModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Box Modal */}
      <Modal
        visible={!!boxToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setBoxToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setBoxToDelete(null)} />
          <View style={styles.modalContent}>
            {boxToDelete && (
              <>
                <Text style={styles.modalTitle}>Supprimer le Box</Text>
                
                <Text style={{ fontSize: theme.typography.sizes.md, color: theme.colors.danger, marginBottom: theme.spacing.md, textAlign: 'center' }}>
                  Attention, cette action est irréversible.
                </Text>
                
                <Text style={styles.inputLabel}>
                  Veuillez taper <Text style={{ fontWeight: 'bold' }}>{boxToDelete.label}</Text> pour confirmer.
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder={boxToDelete.label}
                  placeholderTextColor={theme.colors.textMuted}
                  value={deleteConfirmationText}
                  onChangeText={setDeleteConfirmationText}
                />

                <TouchableOpacity 
                  style={[styles.submitButton, { backgroundColor: theme.colors.danger }]} 
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.submitButtonText}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setBoxToDelete(null)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  harasTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  globalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  globalStatusLabel: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold,
  },
  globalStatusValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: 100, // Large touch target
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickActionText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.text,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.danger,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  listTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Make room for bottom tabs
  },
  boxCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    minHeight: 80, // Large touch target
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  boxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  boxLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  boxIp: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
  },
  boxAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  boxActionText: {
    color: theme.colors.primaryActive,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    marginRight: 4,
  },
  addBoxCard: {
    backgroundColor: 'rgba(43, 87, 151, 0.1)', // Light primary tint
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryActive,
    borderStyle: 'dashed',
    minHeight: 100,
    marginTop: theme.spacing.sm,
  },
  addBoxText: {
    color: theme.colors.primaryActive,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: theme.spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    minHeight: 64, // Touch target
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  submitButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  cancelButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
});
