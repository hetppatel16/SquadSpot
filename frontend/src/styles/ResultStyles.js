import { StyleSheet , Dimensions } from "react-native";

const { width } = Dimensions.get('window');

export const CARD_WIDTH = width * 0.85; 
export const SPACING = (width - CARD_WIDTH) / 2;

export const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH, // Use it here for styling
    height: '100%',
    justifyContent: 'center',
  },
  container: { flex: 1, backgroundColor: '#102217' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  ambientGlow: {
    position: 'absolute', top: '40%', left: '50%', width: 300, height: 400,
    backgroundColor: 'rgba(13, 242, 105, 0.1)', borderRadius: 150,
    transform: [{ translateX: -150 }, { translateY: -200 }],
  },
  safeArea: { flex: 1, zIndex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 70, paddingBottom: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerCenter: { alignItems: 'center' },
  headerLabel: {
    color: '#0df269', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5,
    marginBottom: 2, textTransform: 'uppercase',
  },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cardContainer: { width: CARD_WIDTH, height: '95%', justifyContent: 'center' },
  card: {
    flex: 1, backgroundColor: '#15291f', borderRadius: 32, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
    shadowColor: '#0df269', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  cardImageContainer: { height: 200, width: '100%', position: 'relative' },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  imageGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  cardHeaderContent: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    paddingHorizontal: 24, alignItems: 'center',
  },
  planTitle: {
    fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center',
    marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  priceTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: { color: '#b0eac1', fontSize: 12, marginRight: 4 },
  priceValue: { color: '#0df269', fontSize: 14, fontWeight: 'bold' },
  cardBody: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { width: 40, alignItems: 'center' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c3829',
    borderWidth: 1, borderColor: 'rgba(13, 242, 105, 0.3)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  timelineLine: {
    width: 2, backgroundColor: 'rgba(13, 242, 105, 0.3)',
    flex: 1, marginVertical: 4, borderRadius: 1,
  },
  timelineRight: { flex: 1, paddingLeft: 16, paddingTop: 4 },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stopTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  stopPriceTag: {
    backgroundColor: 'rgba(13, 242, 105, 0.1)', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 6,
  },
  stopPriceText: { color: '#0df269', fontSize: 12, fontWeight: 'bold' },
  stopTime: { color: '#9ca3af', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  stopDesc: { color: '#6b7280', fontSize: 12, lineHeight: 18 },
  cardFooter: { padding: 24, paddingTop: 10 },
  navigateButton: {
    height: 56, backgroundColor: '#0df269', borderRadius: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingLeft: 24, shadowColor: '#0df269',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  navigateText: { color: '#102217', fontSize: 18, fontWeight: 'bold' },
  navIconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 40, marginTop: 5, gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  activeDot: {
    width: 24, backgroundColor: '#0df269', shadowColor: '#0df269',
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 48, height: 48,
    borderRadius: 24, backgroundColor: '#1c3829', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    shadowColor: 'black', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
});