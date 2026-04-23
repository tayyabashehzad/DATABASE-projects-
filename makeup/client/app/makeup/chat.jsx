import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Image, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import arrowleft from "@/assets/icons/arrow_left.png"
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Dropdown } from 'react-native-element-dropdown'
import micIcon from "@/assets/icons/mic.png"
import arrowUpIcon from "@/assets/icons/arrow_up.png"
import { useSelector } from 'react-redux'


const Chat = () => {
    const [messages, setMessages] = useState([
    ]);
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
      const { p_id, user_name } = useSelector(state => state.user);

     const [selectedCourse, setSelectedCourse] = useState(null);
     const [freeSlotsInfo,setFreeSlotsInfo] = useState([]);

     useEffect(()=>{
        // update free slots info here 
     },[selectedCourse])

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


        const SendMessage = ()=>{
            if (!value.trim()) return;
            const userMessage = {
        id: Date.now().toString(), // unique id
        role: 'user',
        content: value
    };
    setMessages(prev => [...prev, userMessage]);
            let payload = {
                history: messages,
                message: value,
                free_slots_info: [
    {
        "14": [
            {
                "free_slot": "08:00:00 - 10:45:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:30:00 - 14:30:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:30:00 - 17:30:00",
                "status": "red",
                "student_id": 101,
                "student_name": "Alice",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "14:30:00 - 17:30:00",
                "status": "red",
                "student_id": 102,
                "student_name": "Bob",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "17:30:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    },
    {
        "36": [
            {
                "free_slot": "08:00:00 - 11:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:00:00 - 14:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:00:00 - 15:10:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "15:55:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    },
    {
        "23": [
            {
                "free_slot": "08:00:00 - 11:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:00:00 - 14:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:00:00 - 16:05:00",
                "status": "red",
                "student_id": 101,
                "student_name": "Alice",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "14:00:00 - 16:05:00",
                "status": "red",
                "student_id": 102,
                "student_name": "Bob",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "16:50:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    },
    {
        "19": [
            {
                "free_slot": "08:00:00 - 11:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:00:00 - 14:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:00:00 - 14:10:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:55:00 - 17:55:00",
                "status": "red",
                "student_id": 101,
                "student_name": "Alice",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "14:55:00 - 17:55:00",
                "status": "red",
                "student_id": 102,
                "student_name": "Bob",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "17:55:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    },
    {
        "7": [
            {
                "free_slot": "08:00:00 - 11:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:00:00 - 13:10:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "13:55:00 - 16:55:00",
                "status": "red",
                "student_id": 101,
                "student_name": "Alice",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "13:55:00 - 16:55:00",
                "status": "red",
                "student_id": 102,
                "student_name": "Bob",
                "conflicting_course": "Frontend Frameworks",
                "conflicting_start": "15:10:00",
                "conflicting_end": "15:55:00"
            },
            {
                "free_slot": "16:55:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    },
    {
        "30": [
            {
                "free_slot": "08:00:00 - 11:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "11:00:00 - 14:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "14:00:00 - 15:10:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            },
            {
                "free_slot": "15:55:00 - 18:00:00",
                "status": "green",
                "student_id": null,
                "student_name": null,
                "conflicting_course": null,
                "conflicting_start": null,
                "conflicting_end": null
            }
        ]
    }
]
            }
            setValue("")

            fetch("https://makeup-backend-lake.vercel.app/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        // 4️⃣ Append bot response
        // Assuming API returns { response: "bot text" } or an array
        const botText = data || "No response from server";
        console.log(botText)
        const botMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: botText
        };
        setMessages(prev => [...prev, botMessage]);
    })
    .catch(err => {
        console.error("Error fetching bot response:", err);
        const errorMessage = {
            id: (Date.now() + 2).toString(),
            type: 'assistant',
            content: "Oops! Something went wrong 😢"
        };
        setMessages(prev => [...prev, errorMessage]);
    });
            
        }
    
    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageBubble,
            item.type === 'user' ? styles.userBubble : styles.botBubble,
            { alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start' }
        ]}>
            {item.type === 'assistant' && <View style={styles.circle} />}
            <Text style={[styles.messageText, item.role === 'user' && { color: '#000' }]}>{item.content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/makeup")}>
                    <Image source={arrowleft} style={styles.arrowIcon} />
                </TouchableOpacity>
                <Text style={styles.headerText}>CHAT</Text>
            </View>

            {/* Dropdown */}
            <View style={styles.dropdownContainer}>
                 <Dropdown
                        style={styles.dropdown}
                        data={courses}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Course"
                        value={selectedCourse?.value}
                        onChange={item => setSelectedCourse(item)}
                />
            </View>

            {/* Chat area */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100} // Adjust for header + dropdown
            >
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 15, paddingBottom: 80 }}
                    showsVerticalScrollIndicator={false}
                />

                {/* Input bar */}
                <View style={styles.inputContainer}>
                    <TextInput
                    value={value}
                    onChangeText={setValue}
                        placeholder="Type your message..."
                        style={styles.input}
                        multiline={true}
                    />
                    <TouchableOpacity onPress={SendMessage} style={styles.sendButton}>
                        <Image source={arrowUpIcon} style={styles.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image source={micIcon} style={styles.icon} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1A44A8',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3
    },
    arrowIcon: { width: 27, height: 27, marginRight: 15 },
    headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },

    dropdownContainer: { padding: 15 },
    dropdown: {
        height: 45,
        borderRadius: 25,
        paddingHorizontal: 15,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    placeholderStyle: { fontSize: 16, color: '#555', fontWeight: '600' },
    selectedTextStyle: { fontSize: 16 },

    messageBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 10,
        borderRadius: 20,
        maxWidth: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
    },
    botBubble: { backgroundColor: '#fff' },
    userBubble: { backgroundColor: '#D9D9D9' },
    messageText: { fontSize: 16, color: '#1A44A8' },
    circle: { width: 10, height: 10, borderRadius: 50, backgroundColor: '#1A44A8', marginRight: 8 },

    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#f2f2f2',
        borderRadius: 25,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#1A44A8',
        padding: 10,
        borderRadius: 25,
        marginRight: 8,
    },
    iconButton: {
        padding: 8,
    },
    icon: { width: 24, height: 24 }
})

export default Chat;
