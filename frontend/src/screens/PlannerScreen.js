import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Keyboard,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { getJsonItem, setJsonItem, STORAGE_KEYS } from '../utils/storage';
import { styles } from '../styles/PlannerStyles';

export default function PlannerScreen({ navigation, route }) {
  const { user, logout } = useAuth();
  
  // Prefer context user, fallback to route param or default
  const activeUser = user || route?.params?.user;
  const fullName = activeUser?.full_name || 'Squad Member';
  const email = activeUser?.email || '';

  const getInitials = (name) => {
    if (!name) return 'SM';
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Restore last selected preferences on launch
  useEffect(() => {
    async function loadSavedDraft() {
      const saved = await getJsonItem(STORAGE_KEYS.SAVED_PREFERENCES);
      if (saved) {
        if (saved.location) setLocation(saved.location);
        if (saved.budget) setBudget(saved.budget);
        if (saved.people) setPeople(saved.people);
        if (saved.selectedVibes) setSelectedVibes(saved.selectedVibes);
        if (saved.duration) setDuration(saved.duration);
      }
    }
    loadSavedDraft();
  }, []);

  // Persist draft whenever inputs change
  const persistDraft = async (updates) => {
    const draft = {
      location,
      budget,
      people,
      selectedVibes,
      duration,
      ...updates
    };
    await setJsonItem(STORAGE_KEYS.SAVED_PREFERENCES, draft);
  };

  const cities = [
    "Vadodara, Gujarat", "Ahmedabad, Gujarat", "Surat, Gujarat",
    "Rajkot, Gujarat", "Mumbai, Maharashtra", "Pune, Maharashtra",
    "Bangalore, Karnataka", "Delhi, India", "Jaipur, Rajasthan",
    "Udaipur, Rajasthan", "Goa, India", "Indore, MP"
  ];

  const handleSearch = (text) => {
    setLocation(text);
    persistDraft({ location: text });
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
    persistDraft({ location: city });
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
    let nextVibes;
    if (selectedVibes.includes(id)) {
      nextVibes = selectedVibes.filter(vId => vId !== id);
    } else {
      nextVibes = [...selectedVibes, id];
    }
    setSelectedVibes(nextVibes);
    persistDraft({ selectedVibes: nextVibes });
  };

  const handleLogout = async () => {
    setShowProfileModal(false);
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to log out?');
      if (confirm) {
        await logout();
        navigation.replace('Login');
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of SquadSpot?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await logout();
              navigation.replace('Login');
            },
          },
        ]
      );
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
            <View>
              <Text style={styles.headerTitle}>Plan Your Outing</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>
                Hey {fullName.split(' ')[0]} 👋
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.8}
            >
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
                <TouchableOpacity onPress={() => { selectCity(''); }}>
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
                onChangeText={(val) => {
                  setBudget(val);
                  persistDraft({ budget: val });
                }}
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
                  onPress={() => {
                    const next = Math.max(1, people - 1);
                    setPeople(next);
                    persistDraft({ people: next });
                  }}
                  style={styles.counterButton}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{people}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const next = people + 1;
                    setPeople(next);
                    persistDraft({ people: next });
                  }}
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
                <TouchableOpacity onPress={() => { setDuration('Few Hrs'); persistDraft({ duration: 'Few Hrs' }); }}>
                  <Text style={[styles.durationText, duration === 'Few Hrs' && styles.activeDuration]}>2h</Text>
                </TouchableOpacity>
                <View style={styles.verticalLine} />
                <TouchableOpacity onPress={() => { setDuration('Half Day'); persistDraft({ duration: 'Half Day' }); }}>
                  <Text style={[styles.durationText, duration === 'Half Day' && styles.activeDuration]}>4h</Text>
                </TouchableOpacity>
                <View style={styles.verticalLine} />
                <TouchableOpacity onPress={() => { setDuration('Full Day'); persistDraft({ duration: 'Full Day' }); }}>
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
                if (Platform.OS === 'web') window.alert('Please choose a city before planning your trip.');
                else Alert.alert('City Required', 'Please choose a city before planning your trip.');
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

      {/* Profile & Session Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View 
            style={{ 
              width: '100%', 
              maxWidth: 340, 
              backgroundColor: '#15291f', 
              borderRadius: 20, 
              padding: 24, 
              borderWidth: 1, 
              borderColor: 'rgba(13,242,105,0.3)',
              alignItems: 'center' 
            }}
          >
            <View style={[styles.profileImagePlaceholder, { width: 64, height: 64, borderRadius: 32, marginBottom: 12 }]}>
              <Text style={[styles.profileInitials, { fontSize: 24 }]}>{initials}</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{fullName}</Text>
            {email ? <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{email}</Text> : null}

            <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 18 }} />

            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: 'rgba(239,68,68,0.15)',
                borderWidth: 1,
                borderColor: '#ef4444',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 15 }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
