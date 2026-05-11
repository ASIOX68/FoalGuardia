import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Alert as RNAlert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { RootStackParamList } from '../Navigation';
import { useStore } from '../store';
import { useAppTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveView'>;

const { width } = Dimensions.get('window');

export default function LiveViewScreen({ route, navigation }: Props) {
  const { boxId } = route.params;
  const { harasName, boxes, alerts, vetNumber } = useStore();
  const theme = useAppTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const video = useRef<Video>(null);
  const viewRef = useRef<View>(null);
  const [status, setStatus] = useState({});
  const [error, setError] = useState<string | null>(null);

  const currentBox = boxes.find((b) => b.id === boxId);
  const currentAlert = alerts.find((a) => a.boxId === boxId);

  // In a real app, you would construct the RTSP/HTTP URL here.
  // Using a sample HLS stream as a placeholder to demonstrate working video player.
  // const videoUrl = `http://${currentBox?.ip}:8080/stream`;
  const videoUrl = 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8';

  useEffect(() => {
    // Hide navigation bar or set orientation to landscape if desired
  }, []);

  if (!currentBox) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Box introuvable.</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBackButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCritical = currentAlert?.type === 'Jument couchée' || currentAlert?.type === 'Poche visible';

  const handleCallVet = () => {
    if (!vetNumber) {
      RNAlert.alert(
        "Numéro manquant",
        "Aucun numéro de vétérinaire n'est configuré.",
        [
          { text: "Fermer", style: "cancel" }
        ]
      );
      return;
    }
    Linking.openURL(`tel:${vetNumber}`);
  };

  const handleCapture = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        RNAlert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie pour sauvegarder des captures.');
        return;
      }

      if (viewRef.current) {
        const uri = await captureRef(viewRef, {
          format: 'jpg',
          quality: 0.9,
        });
        
        await MediaLibrary.saveToLibraryAsync(uri);
        RNAlert.alert('Succès', 'La capture a été enregistrée dans la pellicule !');
      }
    } catch (error) {
      console.error(error);
      RNAlert.alert('Erreur', 'Impossible de capturer l\'image.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={48} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{currentBox.label}</Text>
          <Text style={styles.subtitle}>{harasName} - {currentBox.ip}</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: error ? theme.colors.danger : theme.colors.secondary }]} />
          <Text style={styles.statusText}>{error ? 'Hors ligne' : 'En direct'}</Text>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer} ref={viewRef}>
        <Video
          ref={video}
          style={styles.video}
          source={{ uri: videoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
          onError={(e) => setError(e)}
        />

        {/* AI Overlay Box */}
        <View style={styles.aiOverlayContainer}>
          <View style={styles.aiOverlayHeader}>
            <Ionicons name="scan-outline" size={20} color={theme.colors.text} />
            <Text style={styles.aiOverlayTitle}>ANALYSE IA EN COURS</Text>
          </View>
          
          {currentAlert ? (
            <View style={[styles.alertBanner, isCritical && styles.alertBannerCritical]}>
              <Ionicons name="warning" size={24} color={theme.colors.text} />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertBannerTitle}>{currentAlert.type}</Text>
                <Text style={styles.alertBannerMessage}>{currentAlert.message}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.normalBanner}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
              <Text style={styles.normalText}>Comportement normal détecté.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleCapture}>
          <Ionicons name="camera-outline" size={32} color={theme.colors.text} />
          <Text style={styles.controlText}>Capture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.callButton]} onPress={handleCallVet}>
          <Ionicons name="call" size={32} color={theme.colors.text} />
          <Text style={styles.controlText}>Urgence</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for video full screen feel
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  backButton: {
    padding: theme.spacing.lg, // increased padding for gloves
    minWidth: 64,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  video: {
    width: width,
    height: width * (9 / 16), // 16:9 aspect ratio
    backgroundColor: '#000',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.lg,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  errorBackButton: {
    marginTop: theme.spacing.xl,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  errorBackButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  aiOverlayContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  aiOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    opacity: 0.8,
  },
  aiOverlayTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    marginLeft: theme.spacing.xs,
    letterSpacing: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  alertBannerCritical: {
    backgroundColor: theme.colors.danger,
  },
  alertTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  alertBannerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
  },
  alertBannerMessage: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    opacity: 0.9,
    marginTop: 2,
  },
  normalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 140, 87, 0.8)', // Semi-transparent green
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  normalText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    marginLeft: theme.spacing.sm,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90, // Increased size
    height: 90, // Increased size
    borderRadius: 45,
    backgroundColor: theme.colors.surface,
    borderWidth: 2, // Added border to make it pop
    borderColor: theme.colors.border,
  },
  callButton: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  controlText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md, // Increased font
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weights.bold, // Bolder
  },
});
