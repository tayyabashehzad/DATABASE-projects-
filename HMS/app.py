from flask import Flask, render_template, request, redirect, url_for, session
import psycopg2

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Needed for sessions

# PostgreSQL connection
conn = psycopg2.connect(
    database="hospital_ms",
    user="postgres",
    password="123",
    host="localhost",
    port="5432"
)

# =========================
# HOME
# =========================
@app.route('/')
def home():
    return render_template('home.html')


# =========================
# ADD PATIENT
# =========================
@app.route('/add-patient', methods=['GET', 'POST'])
def add_patient():
    if request.method == 'POST':
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO patient (email, password, name, address, gender)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                request.form['email'],
                request.form['password'],
                request.form['name'],
                request.form['address'],
                request.form['gender']
            ))
            conn.commit()
            cur.close()
            return "Patient Added ✅"
        except Exception as e:
            conn.rollback()
            return str(e)
    return render_template('add_patient.html')


# =========================
# VIEW PATIENTS
# =========================
@app.route('/patients')
def view_patients():
    cur = conn.cursor()
    cur.execute("SELECT email, name, address, gender FROM patient ORDER BY name")
    patients = cur.fetchall()
    cur.close()
    return render_template('view_patients.html', patients=patients)


# =========================
# ADD DOCTOR
# =========================
@app.route('/add-doctor', methods=['GET', 'POST'])
def add_doctor():
    if request.method == 'POST':
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO doctor (email, password, name, gender)
                VALUES (%s, %s, %s, %s)
            """, (
                request.form['email'],
                request.form['password'],
                request.form['name'],
                request.form['gender']
            ))
            conn.commit()
            cur.close()
            return "Doctor Added ✅"
        except Exception as e:
            conn.rollback()
            return str(e)
    return render_template('add_doctor.html')


# =========================
# LOGIN
# =========================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']

        cur = conn.cursor()

        if user_type == 'doctor':
            cur.execute("SELECT email, name FROM doctor WHERE email=%s AND password=%s", (email, password))
        elif user_type == 'patient':
            cur.execute("SELECT email, name FROM patient WHERE email=%s AND password=%s", (email, password))
        else:
            return "Invalid user type"

        user = cur.fetchone()
        cur.close()

        if not user:
            return "Login failed! Wrong email/password."

        # SESSION
        session['user_type'] = user_type
        session['email'] = user[0]
        session['name'] = user[1]

        if user_type == 'doctor':
            return redirect(url_for('doctor_dashboard'))
        elif user_type == 'patient':
            return redirect(url_for('patient_dashboard'))

    return render_template('login.html')


# =========================
# LOGOUT
# =========================
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


# =========================
# PATIENT DASHBOARD
# =========================
@app.route('/patient-dashboard')
def patient_dashboard():
    if 'user_type' not in session or session['user_type'] != 'patient':
        return redirect(url_for('login'))

    patient_email = session['email']

    cur = conn.cursor()
    cur.execute("""
        SELECT a.id, a.date, a.start_time, a.end_time, a.status,
               d.name, dg.diagnosis, dg.prescription
        FROM appointment a
        JOIN patient_attend_appointment pa ON a.id = pa.appointment_id
        LEFT JOIN diagnose dg ON a.id = dg.appointment_id
        LEFT JOIN doctor d ON dg.doctor_email = d.email
        WHERE pa.patient_email=%s
        ORDER BY a.date, a.start_time
    """, (patient_email,))
    appointments = cur.fetchall()
    cur.close()

    return render_template('patient_dashboard.html', appointments=appointments)


# =========================
# BOOK APPOINTMENT
# =========================
@app.route('/book-appointment', methods=['GET', 'POST'])
def book_appointment():
    if 'user_type' not in session or session['user_type'] != 'patient':
        return redirect(url_for('login'))

    if request.method == 'POST':
        doctor_email = request.form['doctor_email']
        date = request.form['date']
        start_time = request.form['start_time']
        end_time = request.form['end_time']
        concerns = request.form.get('concerns', '')

        cur = conn.cursor()
        try:
            # Create appointment
            cur.execute("""
                INSERT INTO appointment (date, start_time, end_time, status)
                VALUES (%s, %s, %s, 'Booked') RETURNING id
            """, (date, start_time, end_time))
            appointment_id = cur.fetchone()[0]

            # Link patient to appointment
            cur.execute("""
                INSERT INTO patient_attend_appointment (patient_email, appointment_id, concerns, symptoms)
                VALUES (%s, %s, %s, '')
            """, (session['email'], appointment_id, concerns))

            conn.commit()
            cur.close()
            return "Appointment booked ✅"
        except Exception as e:
            conn.rollback()
            cur.close()
            return str(e)

    # Load doctors
    cur = conn.cursor()
    cur.execute("SELECT email, name FROM doctor")
    doctors = cur.fetchall()
    cur.close()
    return render_template('book_appointment.html', doctors=doctors)


# =========================
# DOCTOR DASHBOARD
# =========================
@app.route('/doctor-dashboard')
def doctor_dashboard():
    if 'user_type' not in session or session['user_type'] != 'doctor':
        return redirect(url_for('login'))

    doctor_email = session['email']

    cur = conn.cursor()
    cur.execute("""
        SELECT a.id, a.date, a.start_time, a.end_time, a.status,
               p.name, pa.concerns, pa.symptoms,
               dg.diagnosis, dg.prescription
        FROM appointment a
        JOIN patient_attend_appointment pa ON a.id = pa.appointment_id
        LEFT JOIN diagnose dg ON a.id = dg.appointment_id
        JOIN patient p ON pa.patient_email = p.email
        WHERE dg.doctor_email=%s OR dg.doctor_email IS NULL
        ORDER BY a.date, a.start_time
    """, (doctor_email,))
    appointments = cur.fetchall()
    cur.close()

    return render_template('doctor_dashboard.html', appointments=appointments)


# =========================
# DIAGNOSE PATIENT
# =========================
@app.route('/diagnose/<int:appointment_id>', methods=['GET', 'POST'])
def diagnose_patient(appointment_id):
    if 'user_type' not in session or session['user_type'] != 'doctor':
        return redirect(url_for('login'))

    doctor_email = session['email']
    cur = conn.cursor()

    if request.method == 'POST':
        diagnosis = request.form['diagnosis']
        prescription = request.form['prescription']

        # Insert or update diagnose
        cur.execute("""
            INSERT INTO diagnose (appointment_id, doctor_email, diagnosis, prescription)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (appointment_id, doctor_email)
            DO UPDATE SET diagnosis=%s, prescription=%s
        """, (appointment_id, doctor_email, diagnosis, prescription, diagnosis, prescription))
        conn.commit()
        cur.close()
        return redirect(url_for('doctor_dashboard'))

    # Load current diagnosis
    cur.execute("""
        SELECT diagnosis, prescription
        FROM diagnose
        WHERE appointment_id=%s AND doctor_email=%s
    """, (appointment_id, doctor_email))
    result = cur.fetchone()
    cur.close()

    diagnosis, prescription = result if result else ('', '')
    return render_template('diagnose.html', diagnosis=diagnosis, prescription=prescription)


# =========================
if __name__ == '__main__':
    app.run(debug=True)
