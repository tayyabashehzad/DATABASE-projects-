# Makeup - Smart Makeup Class Scheduling App

**Makeup** is a mobile application designed to simplify and automate the process of scheduling makeup classes for **Iqra University H-9 Islamabad Campus** professors. It reduces dependency on administrative staff, automates student availability checks, and provides data-driven recommendations for optimal class scheduling.

---

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Tools & Technologies](#tools--technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Wireframe](#wireframe)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Introduction
Scheduling makeup classes can be time-consuming and inefficient, as professors often need to manually check classroom availability and student schedules. **Makeup** leverages a relational database to store class schedules, student timetables, and room availability, and uses an intelligent algorithm to suggest optimal makeup class slots.  

The system promotes a **Professor-to-Professor** model for coordination, reducing dependency on administrative staff.

---

## Features
- **Eliminate dependency on admin staff:** Professors can check classroom availability directly in the app.
- **Automate student availability checking:** Avoids manually asking each student about timetable clashes.
- **Data-driven scheduling:** Suggests optimal slots where maximum students can attend.
- **Professor-to-Professor coordination:** Professors can manage and coordinate makeup classes directly.
- **Real-time updates:** The system updates schedules in real-time once a makeup class is confirmed.

---

## Architecture
The system follows a **client-server architecture**:

- **Frontend (React Native):** Mobile application interface for professors.  
- **Backend (FastAPI):** RESTful API handling all business logic, timetable comparisons, and database operations.  
- **Database (PostgreSQL via Supabase):** Stores professors, students, courses, timetables, classrooms, and makeup class details.  
- **Algorithm:** Determines optimal makeup class slot based on student availability.
---
[Professor]──<teaches>──[Course]──<has>──[Timetable]──<belongs to>──[Student]
│ │
│ └──<has>──[Makeup_Class]──<held in>──[Classroom]
│ │
│ └──<checks>──[Attendance_Eligibility]──<for>──[Student]
---

## Tools & Technologies
- **Wireframe:** Figma (https://www.figma.com/design/Ep7EtjSzNrTmULnJmjosc8/makeup)  
- **Frontend:** React Native, JavaScript  
- **Backend:** FastAPI, Python  
- **Database:** SQL (PostgreSQL) - Supabase  
- **AI / Model Integration:** Hugging Face  
- **API Testing:** Postman  
- **Editor:** Visual Studio Code (VS Code)  

---


**ER Diagram (Simplified):**-
