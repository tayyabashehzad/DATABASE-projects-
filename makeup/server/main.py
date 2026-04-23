# libraries to import
import os
from supabase import create_client,Client
from fastapi import FastAPI,Request
from dotenv import load_dotenv
from pydantic import BaseModel
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()



SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = os.environ.get("SMTP_PORT")
SMTP_USER = os.environ.get("SMTP_MAIL")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

client = ChatNVIDIA(
  model="meta/llama-3.3-70b-instruct",
  api_key=os.environ.get("LLAMA_KEY"), 
  temperature=0.2,
  top_p=0.7,
  max_tokens=1024,
)

# initializing app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# initializing passlib
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# useful functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# supabase variable initialization
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase : Client =  create_client(url,key)

# models
class LoginRequest(BaseModel):
    registered_name:str 
    p_id: str
    pin: str

class AccountCreationRequest(BaseModel):
    p_id: str
    registered_name:str
    pin:str

class GetCoursesRequest(BaseModel):
    p_id: str

class GetFreeSlots(BaseModel):
    target_day: str 
    course_name: str
    course_day: str
    course_start_time: str 
    course_end_time: str

class BookMakeupRequest(BaseModel):
    p_id:str
    booked_start_time: str
    booked_end_time: str 
    booked_lr: str
    booked_day: str
    course_name: str 
    course_start_time: str 
    course_end_time: str
    course_day:str 

class RemoveBookMakeupRequest(BaseModel):
    p_id: str 
    booked_lr: str 
    booked_start_time:str 
    booked_end_time:str 
    booked_day:str 
    course_name: str 
    course_day: str 
    course_start_time:str 
    course_end_time: str 



# endpoints
@app.post("/login")
def login(req:LoginRequest):
    res = supabase.table("credentials").select("pin").eq("p_id",req.p_id).execute()
    if res.data:
        hashed_password = res.data[0]['pin']
        check = verify_password(req.pin,hashed_password)
        if(check):
            return {"success":"user authenticated successfully."}
        return {"Unauthorized":"User is unauthorized"}
    return "Error Signing In to your account."

@app.post("/account-create")
def account_create(req:AccountCreationRequest):
    hashed_pin = hash_password(req.pin)
    structured_data = {
        "p_id":req.p_id,
        "registered_name":req.registered_name,
        "pin": hashed_pin
    }
    try:
        res = supabase.table("credentials").insert(structured_data).execute()
        if res.data:
            return "Account Created Successfully."
    except:
        return "This user already exists" 
    return "Error creating account."

@app.post("/get-courses")
def get_courses(req:GetCoursesRequest):
    res = supabase.table("teachers_assigned_courses").select("course_name,start_time,end_time,lr,day").eq("p_id",req.p_id).execute()
    if res.data:
        return res.data
    return "No Courses Found."

@app.post("/get-free-slots")
def get_free_slots(req:GetFreeSlots):
    res = supabase.table("lr_reserved").select("lr").execute()
    if res.data:
        lrs = []
        data = set([lr['lr'] for lr in res.data])
        for lr in data:
            res = supabase.rpc("get_free_slot_status",{"lr_input":lr,"target_day":req.target_day,"course_name":req.course_name,"course_day":req.course_day,"course_start":req.course_start_time,"course_end":req.course_end_time}).execute()
            if res.data:
                structured_data = {lr:res.data}
                lrs.append(structured_data)
        return lrs
    return "Error extracting free slots"

@app.post("/remove-booked-makeup")
def remove_booked_makeup(req:RemoveBookMakeupRequest):
    res = supabase.table("makeup_classes").delete().eq("p_id",req.p_id).eq("lr",req.booked_lr).eq("start_time",req.booked_start_time).eq("end_time",req.booked_end_time).eq("day",req.booked_day).eq("course_name",req.course_name).eq("course_day",req.course_day).eq("course_start_time",req.course_start_time).eq("course_end_time",req.course_end_time).execute()
    # return res
    if res.data:
        res = supabase.table("lr_reserved").delete().eq("lr",req.booked_lr).eq("course_name",req.course_name).eq("day",req.booked_day).eq("start_time",req.booked_start_time).eq("end_time",req.booked_end_time).execute()
        if res.data:
            students = supabase.table("students_assigned_courses").select("s_mail").eq("course_assigned",req.course_name).eq("day",req.course_day).eq("start_time",req.course_start_time).eq("end_time",req.course_end_time).execute()
            if students.data:
                mails = [mail['s_mail'] for mail in students.data]
                for mail in mails:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = "Makeup Class Cancelled - Action Required"
                    msg["From"] = SMTP_USER
                    msg["To"] = mail

                    html_body = f"""
                    <html>
                        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                            <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                                
                                <!-- Header -->
                                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                        ⚠️ Makeup Class Cancelled
                                    </h1>
                                    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                                        Important Schedule Update
                                    </p>
                                </div>
                                
                                <!-- Main Content -->
                                <div style="padding: 40px 30px;">
                                    <p style="color: #2d3748; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Dear <strong>Student</strong>,
                                    </p>
                                    
                                    <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                                        We regret to inform you that the previously scheduled makeup class for <strong style="color: #ef4444;">{req.course_name}</strong> 
                                        has been <strong>cancelled</strong>. Please see the cancelled class details below.
                                    </p>
                                    
                                    <!-- Cancelled Class Details Card -->
                                    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                                        <h3 style="color: #991b1b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                                            Cancelled Class Information
                                        </h3>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #7f1d1d; font-size: 14px; display: inline-block; width: 120px;">📖 Course:</span>
                                            <span style="color: #991b1b; font-size: 15px; font-weight: 600; text-decoration: line-through;">{req.course_name}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #7f1d1d; font-size: 14px; display: inline-block; width: 120px;">📅 Date:</span>
                                            <span style="color: #991b1b; font-size: 15px; font-weight: 600; text-decoration: line-through;">{req.booked_day}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #7f1d1d; font-size: 14px; display: inline-block; width: 120px;">🕒 Time:</span>
                                            <span style="color: #991b1b; font-size: 15px; font-weight: 600; text-decoration: line-through;">{req.booked_start_time} - {req.booked_end_time}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 0;">
                                            <span style="color: #7f1d1d; font-size: 14px; display: inline-block; width: 120px;">📍 Venue:</span>
                                            <span style="color: #991b1b; font-size: 15px; font-weight: 600; text-decoration: line-through;">{req.booked_lr}</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Important Notice -->
                                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                                            <strong>📢 Status:</strong> This makeup class has been officially cancelled. 
                                            You do <strong>NOT</strong> need to attend. A new schedule will be communicated separately if rescheduled.
                                        </p>
                                    </div>
                                    
                                    <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 10px 0;">
                                        We apologize for any inconvenience this may cause. If you have any questions or concerns regarding this cancellation, 
                                        please contact the academic office at your earliest convenience.
                                    </p>
                                    
                                    <p style="color: #2d3748; font-size: 15px; margin: 20px 0 0 0;">
                                        Best regards,<br>
                                        <strong style="color: #ef4444;">Academic Scheduling Department</strong>
                                    </p>
                                </div>
                                
                                <!-- Footer -->
                                <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #718096; font-size: 13px; margin: 0 0 10px 0;">
                                        This is an automated notification. Please do not reply to this email.
                                    </p>
                                    <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                        © {datetime.now().year} University Academic Services. All rights reserved.
                                    </p>
                                </div>
                                
                            </div>
                        </body>
                    </html>
                    """

                    # Plain text version
                    text_body = f"""
                    MAKEUP CLASS CANCELLATION NOTICE
                    ═══════════════════════════════════════

                    Dear Student,

                    We regret to inform you that the previously scheduled makeup class for {req.course_name} has been CANCELLED.

                    CANCELLED CLASS DETAILS:
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    Course:     {req.course_name} [CANCELLED]
                    Date:       {req.booked_day} [CANCELLED]
                    Time:       {req.booked_start_time} - {req.booked_end_time} [CANCELLED]
                    Venue:      {req.booked_lr} [CANCELLED]

                    📢 STATUS: This makeup class has been officially cancelled.
                    You do NOT need to attend.

                    A new schedule will be communicated separately if the class is rescheduled.

                    We apologize for any inconvenience this may cause. If you have any questions or concerns, 
                    please contact the academic office immediately.

                    Best regards,
                    Academic Scheduling Department

                    ---
                    This is an automated notification.
                    © {datetime.now().year} University Academic Services
                    """

                    # Attach both HTML and plain text versions
                    part1 = MIMEText(text_body, "plain")
                    part2 = MIMEText(html_body, "html")
                    msg.attach(part1)
                    msg.attach(part2)
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)

                return {"success":"Booking Removed Successfully."} 
    return "Error Removing the booking"

@app.post("/book-makeup")
def book_makeup(req:BookMakeupRequest):
    res = supabase.table('makeup_classes').insert({
        "p_id":req.p_id,
        "lr":req.booked_lr,
        "start_time":req.booked_start_time,
        "end_time":req.booked_end_time,
        "day":req.booked_day,
        "course_name":req.course_name,
        "course_day":req.course_day,
        "course_start_time":req.course_start_time,
        "course_end_time":req.course_end_time
    }).execute()
    if res.data:
        res = supabase.table("lr_reserved").insert({
            "lr":req.booked_lr,
            "course_name":req.course_name,
            "day":req.booked_day,
            "start_time":req.booked_start_time,
            "end_time":req.booked_end_time
        }).execute()
        if res.data:
            students = supabase.table("students_assigned_courses").select("s_mail").eq("course_assigned",req.course_name).eq("day",req.course_day).eq("start_time",req.course_start_time).eq("end_time",req.course_end_time).execute()
            if students.data:
                mails = [mail['s_mail'] for mail in students.data]
                for mail in mails:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = "Makeup Class Alert"
                    msg["From"] = SMTP_USER
                    msg["To"] = mail
                    html_body = f"""
                    <html>
                        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                            <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                                
                                <!-- Header -->
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                        📚 Makeup Class Scheduled
                                    </h1>
                                    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                                        Important Academic Update
                                    </p>
                                </div>
                                
                                <!-- Main Content -->
                                <div style="padding: 40px 30px;">
                                    <p style="color: #2d3748; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Dear <strong>Student</strong>,
                                    </p>
                                    
                                    <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                                        We are writing to inform you about a scheduled makeup class for <strong style="color: #667eea;">{req.course_name}</strong>. 
                                        Please review the details below and mark your calendar accordingly.
                                    </p>
                                    
                                    <!-- Class Details Card -->
                                    <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-left: 4px solid #667eea; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                                        <h3 style="color: #1a202c; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                                            Class Information
                                        </h3>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #718096; font-size: 14px; display: inline-block; width: 120px;">📖 Course:</span>
                                            <span style="color: #2d3748; font-size: 15px; font-weight: 600;">{req.course_name}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #718096; font-size: 14px; display: inline-block; width: 120px;">📅 Date:</span>
                                            <span style="color: #2d3748; font-size: 15px; font-weight: 600;">{req.booked_day}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <span style="color: #718096; font-size: 14px; display: inline-block; width: 120px;">🕒 Time:</span>
                                            <span style="color: #2d3748; font-size: 15px; font-weight: 600;">{req.booked_start_time} - {req.booked_end_time}</span>
                                        </div>
                                        
                                        <div style="margin-bottom: 0;">
                                            <span style="color: #718096; font-size: 14px; display: inline-block; width: 120px;">📍 Venue:</span>
                                            <span style="color: #2d3748; font-size: 15px; font-weight: 600;">{req.booked_lr}</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Important Notice -->
                                    <div style="background-color: #fff5e6; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                                            <strong>⚠️ Attendance Mandatory:</strong> Your presence in this makeup class is essential. 
                                            Please ensure you arrive on time and bring all necessary materials.
                                        </p>
                                    </div>
                                    
                                    <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 10px 0;">
                                        If you have any conflicts or questions regarding this schedule, please contact the academic office 
                                        at your earliest convenience.
                                    </p>
                                    
                                    <p style="color: #2d3748; font-size: 15px; margin: 20px 0 0 0;">
                                        Best regards,<br>
                                        <strong style="color: #667eea;">Academic Scheduling Department</strong>
                                    </p>
                                </div>
                                
                                <!-- Footer -->
                                <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #718096; font-size: 13px; margin: 0 0 10px 0;">
                                        This is an automated notification. Please do not reply to this email.
                                    </p>
                                    <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                        © {datetime.now().year} University Academic Services. All rights reserved.
                                    </p>
                                </div>
                                
                            </div>
                        </body>
                    </html>
                    """

                    # Plain text version
                    text_body = f"""
                    MAKEUP CLASS NOTIFICATION
                    ═══════════════════════════════════════

                    Dear Student,

                    We are writing to inform you about a scheduled makeup class for {req.course_name}.

                    CLASS DETAILS:
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    Course:     {req.course_name}
                    Date:       {req.booked_day}
                    Time:       {req.booked_start_time} - {req.booked_end_time}
                    Venue:      {req.booked_lr}

                    ⚠️ IMPORTANT: Your attendance is mandatory for this makeup class.

                    If you have any conflicts or questions, please contact the academic office immediately.

                    Best regards,
                    Academic Scheduling Department

                    ---
                    This is an automated notification.
                    © {datetime.now().year} University Academic Services
                    """
                    part1 = MIMEText(text_body, "plain")
                    part2 = MIMEText(html_body, "html")
                    msg.attach(part1)
                    msg.attach(part2)

                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)
                
            return {"success":"Booked Successfully."}        
            
    return "Error booking and sending the data"

@app.post("/generate-response")
async def generate_response(req:Request):
    data = await req.json()
    history = data.get("history", [])
    user_message = data.get("message")
    selected_course_free_slots_information = data.get("free_slots_info")
    system_prompt = {
    "role": "system",
    "content": f"""
You are a helpful scheduling assistant for the 'Makeup' app used by Iqra University Faculty to book makeup classes. Be conversational, brief, and actionable. Do not reply in markdown. Always reply in normal English.

IMPORTANT INSTRUCTIONS:
- Only provide free slots or recommendations when the user **explicitly asks** for them (e.g., 'available slots', 'free time', 'recommend a time').
- If the user is just greeting or making small talk (like 'hello', 'hi'), respond naturally without suggesting slots.
- Keep responses concise: 2-3 sentences maximum.
- Be direct and helpful, not robotic.
- When providing slots, focus on GREEN status slots (most students available).

DATA EXPLANATION:
- GREEN status = Most students (50%+) can attend — RECOMMEND these
- RED status = Most students have conflicts — AVOID these
- Each room number (like "14", "36", "23") has different available time slots

RESPONSE STYLE:
✅ Good: "I found 3 great options! Room 36 has slots from 08:00-11:00 and 11:00-14:00. Room 30 is also free from 11:00-14:00."
❌ Bad: Responding with slot suggestions when the user did not ask for availability.

Only suggest slots **if the user asks about available times**.

Available Data:
{selected_course_free_slots_information}
"""
}

    messages = (
        [system_prompt] +
        history +
        [{"role": "user", "content": user_message}]
    )
    try:
        response = client.invoke(messages)
        print(response.content)
        return response.content
    except:
        return "Not available at the moment."

@app.post("/get-makeups")
async def get_makeups(req:Request):
    data = await req.json()
    p_id = data.get("p_id")
    res = supabase.table("makeup_classes").select("*").eq("p_id",p_id).execute()
    if res.data:
        return res.data
    return "No Makeups Available"

@app.get("/")
def root():
    return "Makeup Application Server is running on port 8000"