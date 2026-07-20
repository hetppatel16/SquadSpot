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

import { styles } from '../styles/PlannerStyles';

export default function PlannerScreen({ navigation, route }) {
  const user = route?.params?.user;
  const fullName = user?.full_name || 'Dhairya Soni';

  const getInitials = (name) => {
    if (!name) return 'DS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  };

  const initials = getInitials(fullName);

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
                <Text style={styles.profileInitials}>{initials}</Text>
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
                    <MaterialIcons name="location-city" size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 10 }} />
                    <Text style={{ color: 'white', fontSize: 14 }}>{city}</Text>
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
              Approx. ₹{((parseInt(budget, 10) || 0) / Math.max(1, people)).toFixed(0)} per person
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
            onPress={() => {
              const normalizedLocation = location.trim();
              if (!normalizedLocation) {
                alert('Please choose a city before planning your trip.');
                return;
              }
              navigation.navigate('Loading', {
                location: normalizedLocation,
                budget: budget.trim(),
                people,
                selectedVibes,
                duration,
                mood: selectedVibes.length > 0 ? 'adventurous' : 'relaxed',
              });
            }}
          >
            <Text style={styles.planButtonText}>Plan My Day</Text>
            <MaterialIcons name="auto-awesome" size={24} color="#102217" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

