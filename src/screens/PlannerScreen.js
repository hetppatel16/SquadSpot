import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  StatusBar,
  SafeAreaView,
  Keyboard 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient'; 

export default function PlannerScreen({ navigation }) {
  const [location, setLocation] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);

  const [budget, setBudget] = useState('2500');
  const [people, setPeople] = useState(5);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [duration, setDuration] = useState('Half Day');

  const cities = [
    "Vadodara, Gujarat", "Ahmedabad, Gujarat", "Surat, Gujarat", 
    "Rajkot, Gujarat", "Mumbai, Maharashtra", "Pune, Maharashtra", 
    "Bangalore, Karnataka", "Delhi, India", "Jaipur, Rajasthan",
    "Udaipur, Rajasthan", "Goa, India", "Indore, MP"
  ];

  const handleSearch = (text) => {
    setLocation(text);
    if (text.length > 0) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectCity = (city) => {
    setLocation(city);
    setShowDropdown(false); 
    Keyboard.dismiss();
  };

  const vibes = [
    { id: 1, label: 'Nature', icon: 'tree' },
    { id: 2, label: 'Food', icon: 'utensils' },
    { id: 3, label: 'Adventure', icon: 'mountain' },
    { id: 4, label: 'Chill', icon: 'coffee' },
    { id: 5, label: 'Shopping', icon: 'shopping-bag' },
    { id: 6, label: 'Culture', icon: 'landmark' },
  ];

  const toggleVibe = (id) => {
    if (selectedVibes.includes(id)) {
      setSelectedVibes(selectedVibes.filter(vId => vId !== id));
    } else {
      setSelectedVibes([...selectedVibes, id]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Plan Your Outing</Text>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileImagePlaceholder}>
                 <Text style={styles.profileInitials}>AM</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Location Input Section */}
          <View style={[styles.section, { zIndex: 100 }]}> 
            <Text style={styles.label}>Where are we going?</Text>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={24} color="#0df269" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput}
                value={location}
                onChangeText={handleSearch}
                placeholder="Search City..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              {location.length > 0 && (
                <TouchableOpacity onPress={() => { setLocation(''); setShowDropdown(false); }}>
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown Menu */}
            {showDropdown && (
              <View style={styles.dropdownList}>
                {filteredCities.map((city, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.dropdownItem}
                    onPress={() => selectCity(city)}
                  >
                    <MaterialIcons name="location-city" size={16} color="rgba(255,255,255,0.6)" style={{marginRight: 10}}/>
                    <Text style={{color: 'white', fontSize: 14}}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Budget Input Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Total Group Budget</Text>
            <View style={styles.budgetContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.1)"
              />
            </View>
            <Text style={styles.perPersonText}>
              Approx. ₹{(parseInt(budget) || 0 / Math.max(1, people)).toFixed(0)} per person
            </Text>
          </View>

          {/* Group Size & Duration Row */}
          <View style={styles.rowSection}>
            
            {/* Group Size */}
            <View style={[styles.halfCard, { marginRight: 8 }]}>
              <Text style={styles.cardLabel}>Group Size</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  onPress={() => setPeople(Math.max(1, people - 1))}
                  style={styles.counterButton}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{people}</Text>
                <TouchableOpacity 
                  onPress={() => setPeople(people + 1)}
                  style={styles.counterButton}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration */}
            <View style={[styles.halfCard, { marginLeft: 8 }]}>
              <Text style={styles.cardLabel}>Duration</Text>
              <View style={styles.durationSelector}>
                <TouchableOpacity onPress={() => setDuration('Few Hrs')}>
                   <Text style={[styles.durationText, duration === 'Few Hrs' && styles.activeDuration]}>2h</Text>
                </TouchableOpacity>
                <View style={styles.verticalLine} />
                <TouchableOpacity onPress={() => setDuration('Half Day')}>
                   <Text style={[styles.durationText, duration === 'Half Day' && styles.activeDuration]}>4h</Text>
                </TouchableOpacity>
                <View style={styles.verticalLine} />
                <TouchableOpacity onPress={() => setDuration('Full Day')}>
                   <Text style={[styles.durationText, duration === 'Full Day' && styles.activeDuration]}>Full</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vibe Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>What's the Vibe?</Text>
            <View style={styles.vibesGrid}>
              {vibes.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe.id);
                return (
                  <TouchableOpacity 
                    key={vibe.id} 
                    style={[styles.vibeChip, isSelected && styles.vibeChipSelected]}
                    onPress={() => toggleVibe(vibe.id)}
                  >
                    <FontAwesome5 
                      name={vibe.icon} 
                      size={14} 
                      color={isSelected ? '#102217' : '#0df269'} 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.vibeText, isSelected && styles.vibeTextSelected]}>
                      {vibe.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />

        </ScrollView>
        
        {/* FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.planButton}
            onPress={()=> navigation.navigate('Loading')}
          >
            <Text style={styles.planButtonText}>Plan My Day</Text>
            <MaterialIcons name="auto-awesome" size={24} color="#102217" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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