import { View, Text, SafeAreaView, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown';
import arrowleft from "@/assets/icons/arrow_left.png"
import { useRouter } from 'expo-router';
import CloseIcon from "@/assets/icons/close.png"
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

const Undo = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [confirmedClasses, setConfirmedClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
      const { p_id, user_name } = useSelector(state => state.user);


    // Fetch courses for dropdown
    useEffect(() => {
        if (!p_id) return;
        fetch("https://makeup-backend-lake.vercel.app/get-courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p_id:p_id })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Courses API response:", data);
            // Check if data is an array
            if (Array.isArray(data)) {
                const formatted = data.map((item, index) => ({
                    label: `${item.course_name} | ${item.day} | ${item.start_time} - ${item.end_time} | LR ${item.lr}`,
                    value: index,
                    ...item
                }));
                setCourses(formatted);
            } else {
                console.error("Courses data is not an array:", data);
                setCourses([]);
            }
        })
        .catch(err => {
            console.log("Courses API ERROR:", err);
            setCourses([]);
        });
    }, []);

    // Fetch confirmed makeups
    useEffect(() => {
        if (!p_id || !selectedCourse) {
            setConfirmedClasses([]);
            return;
        }

        setLoading(true);
        fetch("https://makeup-backend-lake.vercel.app/get-makeups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                p_id,
                course_name: selectedCourse.course_name 
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Makeups API response:", data);
            // Check if data is an array
            if (Array.isArray(data)) {
                const formatted = data.map(item => ({
                    label: `LR ${item.lr}`,
                    time: `${item.day} ${item.start_time} - ${item.end_time}`,
                    present: item.present || null,
                    total: item.total || null,
                    status: "good",
                    id: item.id,

                    booked_start_time:item.start_time,
                    booked_end_time:item.end_time,
                    booked_day:item.day,
                    booked_lr: item.lr,
                    course_name:item.course_name,
                    course_day:item.course_day,
                    course_start_time:item.course_start_time,
                    course_end_time:item.course_end_time
                }));
                setConfirmedClasses(formatted);
            } else {
                console.error("Makeups data is not an array:", data);
                setConfirmedClasses([]);
            }
        })
        .catch(err => {
            console.log("Makeups API ERROR:", err);
            setConfirmedClasses([]);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [selectedCourse]);

    const handleRemoveSlot = (slot) => {
        // Remove slot locally
        // setConfirmedClasses(prev => prev.filter(slot => slot.id !== id));
        console.log("Removed slot:", slot);
        const formatTime = (time) => {
        // "09:00:00" => "9:00"
        const [hour, minute] = time.split(":");
        return `${parseInt(hour)}:${minute}`;
    };
      const payload = {
        p_id: p_id,
        booked_start_time: formatTime(slot.booked_start_time),
        booked_end_time: formatTime(slot.booked_end_time),
        booked_lr: slot.booked_lr,
        booked_day: slot.booked_day,
        course_name: slot.course_name,
        course_start_time: slot.course_start_time,
        course_end_time: slot.course_end_time,
        course_day: slot.course_day
    };

    fetch("https://makeup-backend-lake.vercel.app/remove-booked-makeup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Slot removed from server:", data);
        Toast.show({
            type: 'success',
            text1: 'Success!',
            text2: 'Makeup slot removed successfully 👌',
            position: 'bottom',
            visibilityTime: 2000
        });
    })
    .catch(err => {
        console.log("Error removing slot:", err);
         Toast.show({
            type: 'error',
            text1: 'Error!',
            text2: 'Failed to remove slot 😢',
            position: 'bottom',
            visibilityTime: 2000
        });
    });
        
        // TODO: Call API to cancel the makeup
        // fetch("http://192.168.1.4:8000/cancel-makeup", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ makeup_id: id })
        // })
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={()=>router.push("/makeup")} style={styles.backButton}>
                    <Image source={arrowleft} style={styles.arrowIcon}/>
                </TouchableOpacity>
                <Text style={styles.headerText}>UNDO</Text>
            </View>

            <View style={styles.content}>
                {/* Dropdown */}
                <Dropdown
                    style={styles.dropdown}
                    data={courses}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Course"
                    value={selectedCourse?.value}
                    onChange={item => setSelectedCourse(item)}
                />

                {/* Loading indicator */}
                {loading && (
                    <ActivityIndicator size="large" color="#1A44A8" style={{ marginTop: 20 }} />
                )}

                {/* Empty state */}
                {!loading && !selectedCourse && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Select a course to view confirmed makeups</Text>
                    </View>
                )}

                {/* No makeups found */}
                {!loading && selectedCourse && confirmedClasses.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No confirmed makeups found</Text>
                    </View>
                )}

                {/* Confirmed Classes */}
                {!loading && confirmedClasses.length > 0 && (
                    <ScrollView style={{ marginTop: 15 }}>
                        {confirmedClasses.map((slot) => (
                            <View key={slot.id} style={styles.classCard}>
                                <View style={styles.cardLeft}>
                                    <Text style={styles.classLabel}>{slot.label}</Text>
                                    <View style={styles.timeBadge}>
                                        <Text style={styles.timeText}>{slot.time}</Text>
                                    </View>
                                    {slot.present !== null && slot.total !== null && (
                                        <View style={[styles.statusBadge, {backgroundColor: slot.status === "good" ? "#9FFFB1" : "#FF6467"}]}>
                                            <Text style={{color: slot.status === "good" ? "#000" : "#fff"}}>
                                                {slot.present}/{slot.total}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Cross Icon */}
                                <TouchableOpacity onPress={()=>handleRemoveSlot(slot)} style={styles.closeButton}>
                                    <Image source={CloseIcon} style={styles.closeIcon}/>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:"#f5f5f5" },

    header: {
        flexDirection:"row",
        alignItems:"center",
        paddingHorizontal:16,
        paddingVertical:12,
        backgroundColor:"#1A44A8",
        shadowColor:"#000",
        shadowOpacity:0.2,
        shadowOffset:{width:0,height:3},
        elevation:3
    },
    backButton:{ padding:5, marginRight:10 },
    arrowIcon:{ width:27, height:27 },
    headerText:{
        fontSize:23,
        fontWeight:"bold",
        color:"#fff",
        letterSpacing:1
    },

    content:{ padding:20 },

    dropdown:{
        height:45,
        borderRadius:25,
        paddingHorizontal:15,
        backgroundColor:"#e0e0e0",
        borderWidth:1,
        borderColor:"#ccc",
        fontSize:16
    },

    emptyState: {
        marginTop: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
    },

    classCard:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        padding:15,
        marginBottom:12,
        borderRadius:15,
        backgroundColor:"#1971ff",
        shadowColor:"#000",
        shadowOpacity:0.1,
        shadowOffset:{width:0,height:2},
        elevation:2
    },
    cardLeft:{ flexDirection:"row", alignItems:"center", gap:10, flexWrap:"wrap" },

    classLabel:{ fontSize:17, fontWeight:"600", color:"#ffffff" },
    timeBadge:{
        backgroundColor:"#f0f0f0",
        paddingHorizontal:12,
        paddingVertical:4,
        borderRadius:20
    },
    timeText:{ fontSize:14, color:"#333" },

    statusBadge:{
        paddingHorizontal:10,
        paddingVertical:4,
        borderRadius:20,
    },

    closeButton:{ padding:5 },
    closeIcon:{ width:22, height:22 }
})

export default Undo;