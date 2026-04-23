import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import LoggedInUserIcon from "@/assets/icons/User.png";
import undoIcon from "@/assets/icons/undo.png";
import chatIcon from "@/assets/icons/chat.png";
import calenderIcon from "@/assets/icons/calender.png";
import { useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { setUser } from "@/store/userSlice";

export default function Home() {
    const { p_id, user_name } = useSelector(state => state.user);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  // Booking modal states
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingEndTime, setBookingEndTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const router = useRouter();

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  useEffect(() => {
    fetch("https://makeup-backend-lake.vercel.app/get-courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_id: p_id }),
    })
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((item, index) => ({
          label: `${item.course_name} | ${item.day} | ${item.start_time} - ${item.end_time} | LR ${item.lr}`,
          value: index,
          ...item,
        }));
        setCourses(formatted);
      })
      .catch(err => {
        console.log("API ERROR:", err);
      });
  }, []);

  const getWeekDay = (date) => {
    const options = { weekday: "long" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  const [slotsData, setSlotsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFreeSlots = async () => {
    if (!selectedDate || !selectedCourse) {
      setSlotsData([]);
      return;
    }

    setLoading(true);

    const payload = {
      target_day: getWeekDay(selectedDate),
      course_name: selectedCourse.course_name,
      course_day: selectedCourse.day,
      course_start_time: selectedCourse.start_time,
      course_end_time: selectedCourse.end_time,
    };

    try {
      const res = await fetch("https://makeup-backend-lake.vercel.app/get-free-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSlotsData(data);
    } catch (error) {
      console.error("API Error:", error);
      setSlotsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreeSlots();
  }, [selectedDate, selectedCourse]);

  // Handle slot selection
  const handleSlotPress = (slot, roomNumber) => {
    setSelectedSlot(slot);
    setSelectedRoom(roomNumber);
    setBookingStartTime("");
    setBookingEndTime("");
    setIsBookingModalVisible(true);
  };

  // Format time to HH:MM format (remove seconds if present)
  const formatTime = (timeStr) => {
    // If time is in HH:MM:SS format, convert to HH:MM
    if (timeStr.split(':').length === 3) {
      const parts = timeStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  // Validate and confirm booking
  const handleConfirmBooking = async () => {
    if (!bookingStartTime || !bookingEndTime) {
      Alert.alert("Error", "Please select both start and end times");
      return;
    }

    // Extract slot times
    const [slotStart, slotEnd] = selectedSlot.free_slot.split(" - ");

    // Validate times
    if (bookingStartTime < slotStart) {
      Alert.alert("Error", `Start time must be equal to or greater than ${slotStart}`);
      return;
    }

    if (bookingEndTime > slotEnd) {
      Alert.alert("Error", `End time must be equal to or less than ${slotEnd}`);
      return;
    }

    if (bookingStartTime >= bookingEndTime) {
      Alert.alert("Error", "End time must be after start time");
      return;
    }

    const bookingData = {
      p_id: p_id,
      booked_start_time: formatTime(bookingStartTime),
      booked_end_time: formatTime(bookingEndTime),
      booked_lr: selectedRoom,
      booked_day: getWeekDay(selectedDate),
      course_name: selectedCourse.course_name,
      course_start_time: formatTime(selectedCourse.start_time),
      course_end_time: formatTime(selectedCourse.end_time),
      course_day: selectedCourse.day,
    };

    console.log("Booking Data:", bookingData);

    // Call the booking API
    setIsBooking(true);
    try {
      const response = await fetch("https://makeup-backend-lake.vercel.app/book-makeup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Class Confirmed! ✅',
          text2: 'Mails sent to students successfully',
          position: 'top',
          visibilityTime: 3000,
        });

        // Close modal and reset
        setIsBookingModalVisible(false);
        setSelectedSlot(null);
        setSelectedRoom(null);
        setBookingStartTime("");
        setBookingEndTime("");

        // Optionally refresh the slots
        fetchFreeSlots();
      } else {
        // Show error alert
        Alert.alert("Booking Failed", result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Booking API Error:", error);
      Alert.alert("Error", "Failed to book makeup class. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const dispatch = useDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A44A8" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IU MAKEUP</Text>
        <TouchableOpacity onPress={() => {
          dispatch(setUser({ p_id: "", user_name: "" }));
          router.push("/")}}>
          <Image source={LoggedInUserIcon} style={styles.userIcon} />
        </TouchableOpacity>
      </View>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <Dropdown
          style={styles.dropdown}
          data={courses}
          labelField="label"
          valueField="value"
          placeholder="Select Course"
          value={selectedCourse?.value}
          onChange={item => setSelectedCourse(item)}
        />

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push({
            pathname: "/makeup/undo",
            params: {
              p_id: p_id,
            },
          })}
        >
          <Image source={undoIcon} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search room"
        />
        
        <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
          <Image source={calenderIcon} style={styles.icon} />
          <Text style={styles.dateText}>
            {selectedDate ? selectedDate.toDateString() : "Select a date"}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />

        <TouchableOpacity onPress={() => router.push({
            pathname: "/makeup/chat",
            params: {
              p_id: p_id,
            },
          })}>
          <Image source={chatIcon} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* ROOMS */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A44A8" style={{ marginTop: 20 }} />
      ) : slotsData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {!selectedDate || !selectedCourse 
              ? "Select a course and date to view available slots"
              : "No slots available"}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.roomsContainer}>
          {slotsData.map((roomObj, index) => {
            const roomNumber = Object.keys(roomObj)[0];
            const slots = roomObj[roomNumber];
            
            return (
              <View key={index} style={styles.roomCard}>
                <Text style={styles.roomTitle}>LR {roomNumber}</Text>
                {slots.map((slot, slotIndex) => (
                  <TouchableOpacity
                    key={slotIndex}
                    style={[
                      styles.slot,
                      slot.status === "green" ? styles.goodSlot : styles.badSlot,
                    ]}
                    onPress={() => handleSlotPress(slot, roomNumber)}
                  >
                    <Text style={[
                      styles.slotText,
                      slot.status === "green" ? styles.goodText : styles.badText,
                    ]}>
                      {slot.free_slot}
                    </Text>
                    {slot.status === "red" && slot.conflicting_course && (
                      <Text style={[styles.conflictText, { color: '#fff', fontSize: 12, marginTop: 4 }]}>
                        Conflicts: {slot.conflicting_course} ({slot.student_name})
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* BOOKING MODAL */}
      <Modal
        visible={isBookingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Slot</Text>
            
            {selectedSlot && (
              <>
                <Text style={styles.modalSubtitle}>
                  LR {selectedRoom} | {selectedSlot.free_slot}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH:MM or HH:MM:SS"
                    value={bookingStartTime}
                    onChangeText={setBookingStartTime}
                    editable={!isBooking}
                  />
                  <Text style={styles.helperText}>
                    Must be ≥ {selectedSlot.free_slot.split(" - ")[0]}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH:MM or HH:MM:SS"
                    value={bookingEndTime}
                    onChangeText={setBookingEndTime}
                    editable={!isBooking}
                  />
                  <Text style={styles.helperText}>
                    Must be ≤ {selectedSlot.free_slot.split(" - ")[1]}
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsBookingModalVisible(false)}
                    disabled={isBooking}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleConfirmBooking}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast component */}
      <Toast />

      <BlurView intensity={40} tint="light" style={styles.blurFooter} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  header: {
    backgroundColor: "#1A44A8",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },

  userIcon: {
    width: 30,
    height: 30,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },

  conflictText: {
    fontSize: 12,
    marginTop: 4,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },

  dropdown: {
    flex: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 14,
  },

  iconBtn: {
    backgroundColor: "#e5e7eb",
    padding: 8,
    borderRadius: 20,
  },

  icon: {
    width: 26,
    height: 26,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  roomsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  roomCard: {
    backgroundColor: "#1A44A8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  roomTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  slot: {
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },

  goodSlot: {
    backgroundColor: "#61ff98",
  },

  badSlot: {
    backgroundColor: "#FF6467",
  },

  slotText: {
    textAlign: "center",
    fontWeight: "600",
  },

  goodText: {
    color: "#000",
  },

  badText: {
    color: "#232323",
  },

  blurFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A44A8",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  timeInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    fontSize: 16,
  },

  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#e5e7eb",
  },

  confirmButton: {
    backgroundColor: "#1A44A8",
  },

  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});