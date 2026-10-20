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
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { getJsonItem, setJsonItem, STORAGE_KEYS } from '../utils/storage';
import { styles } from '../styles/PlannerStyles';
import { validateBudget } from '../utils/Validations';
import { searchCities } from '../services/api';
import CustomSlider from '../components/CustomSlider';
import { confirmAction, notify } from '../utils/feedback';
import StartTimePicker, { DEFAULT_START_TIME } from '../components/StartTimePicker';
import { nearestCity } from '../utils/geo';

// "Use my location" is web-only for now: browsers provide navigator.geolocation.
// Mobile: install expo-location (`npx expo install expo-location`) and replace the
// navigator.geolocation call in handleUseMyLocation with
// Location.requestForegroundPermissionsAsync() + Location.getCurrentPositionAsync().
const CAN_USE_MY_LOCATION = Platform.OS === 'web' && typeof navigator !== 'undefined' && !!navigator.geolocation;
// Must match USER_START_MAX_KM in the backend's itinerary_service.py.
const USER_START_MAX_KM = 50;
const ALL_CITIES_LIMIT = 100;

// At this width (desktop browsers, tablets in landscape) the form is shown in
// two columns with the Plan button below it; narrower screens keep the
// single-column phone layout with the floating button.
const WIDE_LAYOUT_MIN_WIDTH = 900;

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
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN_WIDTH;

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

  // SquadSpot was built for Vadodara, so it is the starting city; any other
  // active city can still be searched. A saved draft city takes precedence.
  const [location, setLocation] = useState('Vadodara, Gujarat');
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
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  // The user's position from "Use my location"; null when they typed or picked a city.
  // Not saved with the draft, so a stale position is never reused.
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
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
        if (saved.startTime) setStartTime(saved.startTime);
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
      startTime,
      ...updates
    };
    await setJsonItem(STORAGE_KEYS.SAVED_PREFERENCES, draft);
  };


  // Update search input and save the user's draft.
  const handleSearch = (text) => {
    setLocation(text);
    setCityQuery(text);
    setCitiesError('');
    setUserLocation(null);

    setShowDropdown(text.trim().length > 0);

    persistDraft({ location: text });
  };


  // Select a city returned by the backend. Picking a city by hand means the
  // trip starts from its centre, so any "Use my location" position is dropped.
  const selectCity = (city, nextUserLocation = null) => {
    setUserLocation(nextUserLocation);
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


  // Fill in the nearest active city from the browser's location (web only, see CAN_USE_MY_LOCATION).
  const handleUseMyLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const here = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          const nearest = nearestCity(await searchCities('', ALL_CITIES_LIMIT), here);
          if (!nearest) {
            notify('No Cities Found', 'The city list could not be loaded. Please search for a city instead.');
            return;
          }
          if (nearest.km <= USER_START_MAX_KM) {
            selectCity(nearest.city, here);
            notify('Location Found', `Planning in ${nearest.city.name}, starting from where you are.`, 'success');
          } else {
            selectCity(nearest.city);
            notify(
              'Location Found',
              `The nearest SquadSpot city is ${nearest.city.name}, about ${Math.round(nearest.km)} km away. The trip will start from its city centre.`,
              'info'
            );
          }
        } catch (error) {
          notify('Location Unavailable', 'The city list could not be loaded. Please search for a city instead.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        notify(
          'Location Unavailable',
          error.code === 1
            ? 'Location permission was denied. You can still search for a city.'
            : 'Your location could not be found. Please search for a city instead.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  // Clear the selected city.
  const clearCity = () => {
    setUserLocation(null);
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
    { id: 7, label: 'Movies', icon: 'film' },
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
      notify('Name Required', 'Please enter your name.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUser({ full_name: cleanName });
      setIsEditingProfile(false);
      notify('Profile Updated', 'Your profile has been updated.', 'success');
    } catch (error) {
      notify('Update Failed', error.message || 'Unable to update your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setShowProfileModal(false);
    const confirmed = await confirmAction({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of SquadSpot?',
      confirmText: 'Sign Out',
      destructive: true,
    });
    if (confirmed) {
      await logout();
    }
  };

  const handlePlan = () => {
    const normalizedLocation = location.trim();
    if (!normalizedLocation) {
      notify('City Required', 'Please choose a city before planning your trip.');
      return;
    }
    if (!validateBudget(budget)) {
      notify('Invalid Budget', 'Please enter a valid budget greater than ₹0.');
      return;
    }
    navigation.navigate('Loading', {
      location: normalizedLocation,
      budget: budget.trim(),
      people,
      selectedVibes,
      duration,
      startTime,
      userLocation,
      mood: selectedVibes.includes(4) ? 'chill' : null,
    });
  };

  const planButton = (
    <TouchableOpacity style={styles.planButton} onPress={handlePlan} accessibilityRole="button">
      <Text style={styles.planButtonText}>Plan My Day</Text>
      <MaterialIcons name="auto-awesome" size={24} color="#102217" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
        >

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
              accessibilityRole="button"
              accessibilityLabel="Open profile menu"
            >
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>{initials}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Wide screens: two columns (where & budget | group, time & interests). */}
          <View style={isWide ? styles.wideColumns : null}>
          {/* zIndex keeps the city dropdown above the right-hand column. */}
          <View style={isWide ? [styles.wideColumn, { zIndex: 10 }] : null}>

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
                <TouchableOpacity onPress={clearCity} accessibilityRole="button" accessibilityLabel="Clear city">
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
              {CAN_USE_MY_LOCATION && (
                <TouchableOpacity
                  onPress={handleUseMyLocation}
                  disabled={isLocating}
                  style={styles.myLocationButton}
                  accessibilityRole="button"
                  accessibilityLabel="Use my location"
                >
                  {isLocating
                    ? <ActivityIndicator size="small" color="#0df269" />
                    : <MaterialIcons name="my-location" size={22} color="#0df269" />}
                </TouchableOpacity>
              )}
            </View>
            {userLocation && (
              <Text style={styles.locationNote}>Starting from your current location</Text>
            )}

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

          </View>
          <View style={isWide ? styles.wideColumn : null}>

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
                  accessibilityRole="button"
                  accessibilityLabel="Fewer people"
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
                  accessibilityRole="button"
                  accessibilityLabel="More people"
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

          {/* Start Time */}
          <View style={styles.startTimeCard}>
            <Text style={styles.cardLabel}>Start Time</Text>
            <StartTimePicker
              value={startTime}
              onChange={(next) => {
                setStartTime(next);
                persistDraft({ startTime: next });
              }}
            />
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
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

          </View>
          </View>

          {/* Wide screens: the button sits under the form. Phones: floating button below. */}
          {isWide ? (
            <View style={styles.inlinePlanButton}>{planButton}</View>
          ) : (
            <View style={{ height: 100 }} />
          )}

        </ScrollView>

        {/* Floating button (narrow screens); hidden while the profile menu is open. */}
        {!isWide && !showProfileModal && (
          <View style={styles.fabContainer}>{planButton}</View>
        )}

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
