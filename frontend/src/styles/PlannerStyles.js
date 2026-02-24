import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102217',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60, // <--- CHANGED: Increased from default to 60 (Pushes everything down)
    paddingBottom: 120, // Adds space at bottom so content doesn't get hidden behind the floating button
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40, // <--- CHANGED: Increased from 32 (More space below title)
    marginTop: 20,    // <--- CHANGED: Increased from 10 (More space above title)
  },
  headerTitle: {
    fontSize: 32, // <--- CHANGED: Slightly bigger for better visual balance
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileInitials: {
    color: '#0df269',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 40, // <--- CHANGED: Increased from 32 (Spreads out the inputs to fill empty space)
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 40,
    color: '#0df269',
    fontWeight: '300',
    marginRight: 4,
  },
  budgetInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    minWidth: 100,
  },
  perPersonText: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 14,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: 40, // <--- CHANGED: Increased from 32
  },
  halfCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  durationText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    fontSize: 15,
  },
  activeDuration: {
    color: '#0df269',
  },
  verticalLine: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#0df269',
    backgroundColor: 'transparent',
  },
  vibeChipSelected: {
    backgroundColor: '#0df269',
  },
  vibeText: {
    color: '#0df269',
    fontWeight: '600',
  },
  vibeTextSelected: {
    color: '#102217',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  planButton: {
    backgroundColor: '#0df269',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0df269',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  planButtonText: {
    color: '#102217',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Add these to your existing styles
  dropdownList: {
    position: 'absolute', // Floats over other content
    top: 85, // Positions it right below the input
    left: 0,
    right: 0,
    backgroundColor: '#1c3829', // Dark card color
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 1000, // Ensures it sits ON TOP of everything
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownText: {
    color: 'white',
    fontSize: 14,
  },
});