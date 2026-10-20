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
import { validateBudget } from '../utils/Validations';
import { searchCities } from '../services/api';
import CustomSlider from '../components/CustomSlider';

const parseDurationHours = (val) => {
  if (typeof val === 'number') return val;
  if (val === 'Few Hrs' || val === '2h') return 2;
  if (val === 'Half Day' || val === '4h') return 4;
  if (val === 'Full Day' || val === 'Full' || val === '8h') return 8;
  const num = parseInt(val, 10);
  return isNaN(num) ? 4 : num;
};

export default function PlannerScreen({ navigation, route }) {
  const { user, logout, updateUser } = useAuth();

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
  // City search states
  const [cityQuery, setCityQuery] = useState('');
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState('');
  const [budget, setBudget] = useState('2500');
  const [people, setPeople] = useState(5);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [duration, setDuration] = useState(4);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Restore last selected preferences on launch
  useEffect(() => {
    async function loadSavedDraft() {
      const saved = await getJsonItem(STORAGE_KEYS.SAVED_PREFERENCES);
      if (saved) {
        if (saved.location) setLocation(saved.location);
        if (saved.budget) setBudget(saved.budget);
        if (saved.people) setPeople(saved.people);
        if (saved.selectedVibes) setSelectedVibes(saved.selectedVibes);
        if (saved.duration !== undefined) setDuration(parseDurationHours(saved.duration));
      }
    }
    loadSavedDraft();
  }, []);
  // Fetch cities dynamically whenever the user searches.
  useEffect(() => {
    const query = cityQuery.trim();

    if (!showDropdown || !query) {
      setFilteredCities([]);
      setCitiesLoading(false);
      return;
    }

    let isActive = true;

    // Wait briefly before calling the backend.
    // This avoids making an API request for every keystroke.
    const timer = setTimeout(async () => {
      setCitiesLoading(true);
      setCitiesError('');

      try {
        const results = await searchCities(query);

        if (isActive) {
          setFilteredCities(results);
        }

      } catch (error) {
        if (isActive) {
          setFilteredCities([]);
          setCitiesError('Unable to load cities. Please try again.');
        }

      } finally {
        if (isActive) {
          setCitiesLoading(false);
        }
      }

    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };

  }, [cityQuery, showDropdown]);

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


  // Update search input and save the user's draft.
  const handleSearch = (text) => {
    setLocation(text);
    setCityQuery(text);
    setCitiesError('');

    setShowDropdown(text.trim().length > 0);

    persistDraft({ location: text });
  };


  // Select a city returned by the backend.
  const selectCity = (city) => {
    const cityLabel = [
      city.name,
      city.state_region || city.country
    ]
      .filter(Boolean)
      .join(', ');

    setLocation(cityLabel);
    setCityQuery('');
    setShowDropdown(false);
    setFilteredCities([]);
    setCitiesError('');

    persistDraft({ location: cityLabel });

    Keyboard.dismiss();
  };


  // Clear the selected city.
  const clearCity = () => {
    setLocation('');
    setCityQuery('');
    setShowDropdown(false);
    setFilteredCities([]);
    setCitiesError('');

    persistDraft({ location: '' });
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

  const handleSaveProfile = async () => {
    const cleanName = profileNameDraft.trim();
    if (!cleanName) {
      const message = 'Please enter your name.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Name Required', message);
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUser({ full_name: cleanName });
      setIsEditingProfile(false);
      const message = 'Your profile has been updated.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Profile Updated', message);
    } catch (error) {
      const message = error.message || 'Unable to update your profile.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Update Failed', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setShowProfileModal(false);
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to log out?');
      if (confirm) {
        await logout();
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
                <TouchableOpacity onPress={clearCity}>
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown Menu */}
            {showDropdown && (
              <View style={styles.dropdownList}>

                {citiesLoading ? (

                  <Text style={{ color: 'white', padding: 12 }}>
                    Searching cities...
                  </Text>

                ) : citiesError ? (

                  <Text style={{ color: '#ff7777', padding: 12 }}>
                    {citiesError}
                  </Text>

                ) : filteredCities.length > 0 ? (

                  filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={styles.dropdownItem}
                      onPress={() => selectCity(city)}
                    >
                      <MaterialIcons
                        name="location-city"
                        size={16}
                        color="rgba(255,255,255,0.6)"
                        style={{ marginRight: 10 }}
                      />

                      <Text style={{ color: 'white', fontSize: 14 }}>
                        {[city.name, city.state_region || city.country]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>

                    </TouchableOpacity>
                  ))

                ) : (

                  <Text style={{ color: 'white', padding: 12 }}>
                    No matching active cities found.
                  </Text>

                )}

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
              <View style={styles.durationHeaderRow}>
                <Text style={[styles.cardLabel, { marginBottom: 0 }]}>Duration</Text>
                <Text style={styles.durationValueBadge}>{duration} hrs</Text>
              </View>
              <CustomSlider
                min={1}
                max={12}
                step={1}
                value={duration}
                onValueChange={(val) => {
                  setDuration(val);
                  persistDraft({ duration: val });
                }}
                ticks={[1, 4, 8, 12]}
                tickLabels={['1h', '4h', '8h', '12h']}
              />
            </View>
          </View>

          {/* Vibe Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>What are you interested in?</Text>
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
              if (!validateBudget(budget)) {
                const message = 'Please enter a valid budget greater than ₹0.';

                if (Platform.OS === 'web') {
                  window.alert(message);
                } else {
                  Alert.alert('Invalid Budget', message);
                }

                return;
              }
              navigation.navigate('Loading', {
                location: normalizedLocation,
                budget: budget.trim(),
                people,
                selectedVibes,
                duration,
                mood: selectedVibes.includes(4) ? 'chill' : null,
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
          onPress={() => { setShowProfileModal(false); setIsEditingProfile(false); }}
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
            {isEditingProfile ? (
              <View style={{ width: '100%', gap: 10 }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Full name</Text>
                <TextInput
                  value={profileNameDraft}
                  onChangeText={setProfileNameDraft}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  maxLength={120}
                  style={{ color: 'white', borderWidth: 1, borderColor: 'rgba(13,242,105,0.35)', borderRadius: 10, padding: 12, width: '100%' }}
                />
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                  style={{ width: '100%', backgroundColor: '#0df269', paddingVertical: 11, borderRadius: 10, alignItems: 'center', opacity: isSavingProfile ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#102217', fontWeight: 'bold' }}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsEditingProfile(false)}
                  disabled={isSavingProfile}
                  style={{ width: '100%', paddingVertical: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: '#94a3b8' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{fullName}</Text>
                {email ? <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{email}</Text> : null}
                <TouchableOpacity
                  onPress={() => { setProfileNameDraft(fullName); setIsEditingProfile(true); }}
                  style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(13,242,105,0.4)' }}
                >
                  <Text style={{ color: '#0df269', fontWeight: '600' }}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}

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
