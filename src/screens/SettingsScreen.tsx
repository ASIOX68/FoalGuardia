import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { harasName, setHarasName, vetNumber, setVetNumber, boxes, addAlert } = useStore();
  
  const [localHarasName, setLocalHarasName] = useState(harasName);
  const [localVetPhone, setLocalVetPhone] = useState(vetNumber);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = ('' + text).replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);
    // Add spaces every 2 digits
    const match = limited.match(/.{1,2}/g);
    const formatted = match ? match.join(' ') : '';
    setLocalVetPhone(formatted);
  };

  const handleSaveSettings = () => {
    if (!localHarasName.trim()) {
      RNAlert.alert("Erreur", "Le nom de l'écurie ne peut pas être vide.");
      return;
    }
    
    setHarasName(localHarasName);
    setVetNumber(localVetPhone);
    RNAlert.alert("Succès", "Paramètres sauvegardés avec succès.");
  };

  const simulateAlert = () => {
    if (boxes.length === 0) {
      RNAlert.alert("Erreur", "Ajoutez au moins un box pour simuler une alerte.");
      return;
    }
    
    const randomBox = boxes[Math.floor(Math.random() * boxes.length)];
    const types = ["Jument couchée", "Poche visible", "Mouvement anormal", "Agitation"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    addAlert({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      boxId: randomBox.id,
      type: randomType,
      message: `L'IA a détecté: ${randomType} dans le ${randomBox.label}.`
    });
    
    RNAlert.alert("Alerte simulée", `Une alerte a été générée pour ${randomBox.label}.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paramètres</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration de l'Écurie</Text>
        
        <Text style={styles.inputLabel}>Nom de l'établissement</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Haras des Plaines"
          placeholderTextColor={theme.colors.textMuted}
          value={localHarasName}
          onChangeText={setLocalHarasName}
        />

        <Text style={styles.inputLabel}>Appel d'Urgence (Vétérinaire)</Text>
        <TextInput
          style={styles.input}
          placeholder="Numéro (ex: 06 12 34 56 78)"
          placeholderTextColor={theme.colors.textMuted}
          value={localVetPhone}
          onChangeText={formatPhoneNumber}
          keyboardType="phone-pad"
          maxLength={14} // 10 digits + 4 spaces
        />

        <TouchableOpacity style={styles.button} onPress={handleSaveSettings}>
          <Ionicons name="save-outline" size={24} color={theme.colors.text} style={{marginRight: 8}} />
          <Text style={styles.buttonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outils de Test</Text>
        <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={simulateAlert}>
          <Ionicons name="warning-outline" size={24} color={theme.colors.text} style={{marginRight: 8}} />
          <Text style={styles.buttonText}>Simuler une Alerte IA</Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 120,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
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
    minHeight: 64, // Touch target
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    fontSize: theme.typography.sizes.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 64, // Touch target
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDanger: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
});
