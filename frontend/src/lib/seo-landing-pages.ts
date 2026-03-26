export interface SeoLandingPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  keyword: string;
  sections: {
    heading: string;
    body: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  ctaHeadline: string;
  ctaBody: string;
}

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "phone-reminder-for-medication",
    title: "Phone Reminder for Medication",
    metaTitle: "Phone Reminder for Medication | Never Miss a Dose",
    metaDescription:
      "Get AI-powered phone calls to remind you about your medication. Dialcues calls you at the right time so you stay on track with your prescriptions.",
    heroHeadline: "Never miss a dose again",
    heroSubheadline:
      "Dialcues calls you with a friendly voice reminder every time you need to take your medication. No more silent notifications you accidentally ignore.",
    keyword: "phone reminder for medication",
    sections: [
      {
        heading: "Why medication reminders matter",
        body: "Nearly 50% of medications for chronic illnesses are not taken as prescribed. Missed doses lead to hospitalizations, worsening conditions, and unnecessary costs. Unlike push notifications that get swiped away, a phone call demands your attention in the moment — making it the most reliable reminder method available.",
      },
      {
        heading: "How Dialcues medication reminders work",
        body: "Set your medication schedule in Dialcues with the exact times you need to take each dose. At the scheduled time, you receive a real phone call with a clear, friendly AI voice that tells you exactly which medication to take. You can set daily, weekly, or custom recurring schedules — and Dialcues even retries if you miss the first call.",
      },
      {
        heading: "Perfect for caregivers and family members",
        body: "If you care for an elderly parent or family member, Dialcues lets you set up reminder calls on their phone. They don't need to install an app or learn new technology — they just answer the phone. It works on any phone, including landlines, making it ideal for seniors who aren't comfortable with smartphone apps.",
      },
      {
        heading: "More reliable than apps and alarms",
        body: "Phone alarms get dismissed on autopilot. App notifications get buried. But a phone call is different — it rings until you answer. Dialcues uses AI voice technology to deliver your reminder in a natural, conversational way that feels personal, not robotic. Studies show that voice-based reminders significantly improve medication adherence compared to text-based alerts.",
      },
    ],
    faqs: [
      {
        question: "Can I set different reminders for different medications?",
        answer: "Yes. You can create individual reminders for each medication, each with its own schedule, message, and timing.",
      },
      {
        question: "Does the person need a smartphone?",
        answer: "No. Dialcues calls any phone number, including landlines and basic phones. No app installation required for the person receiving the call.",
      },
      {
        question: "What happens if I don't answer?",
        answer: "Dialcues will automatically retry the call after a few minutes. You can configure how many retry attempts you want.",
      },
    ],
    ctaHeadline: "Start your medication reminders today",
    ctaBody: "Sign up for Dialcues and set up your first medication reminder in under 2 minutes.",
  },
  {
    slug: "phone-reminder-for-appointments",
    title: "Phone Reminder for Appointments",
    metaTitle: "Phone Reminder for Appointments | Reduce No-Shows",
    metaDescription:
      "Automated phone call reminders for appointments. Dialcues reduces no-shows by calling patients, clients, or yourself before every appointment.",
    heroHeadline: "Reduce no-shows with phone call reminders",
    heroSubheadline:
      "Dialcues calls you or your clients before every appointment so nobody forgets. An AI voice delivers the reminder naturally — no robocalls, no spam feel.",
    keyword: "phone reminder for appointments",
    sections: [
      {
        heading: "The no-show problem",
        body: "Missed appointments cost healthcare providers, salons, consultants, and small businesses billions of dollars annually. The average no-show rate across industries ranges from 10% to 30%. A simple phone call reminder the day before — or the morning of — can cut no-shows by more than half.",
      },
      {
        heading: "How Dialcues appointment reminders work",
        body: "Create a reminder with the appointment date, time, and a custom message. Dialcues calls the specified phone number with a clear, professional AI voice that delivers the details. You can schedule reminders for yourself, your team, or your clients. Set them once or create recurring patterns for regular appointments.",
      },
      {
        heading: "Built for small businesses and clinics",
        body: "Whether you run a dental practice, a tutoring service, or a consulting firm, Dialcues gives you automated phone reminders without expensive enterprise software. Set up reminders through a simple dashboard, and your clients receive professional-sounding calls that represent your business well.",
      },
      {
        heading: "Why phone calls beat text and email",
        body: "Emails go unread. SMS gets lost in a sea of messages. But phone calls get answered — or at least noticed. Dialcues calls feel personal because they use natural AI voice, not a robotic recording. Recipients can even interact with the call to confirm, snooze, or dismiss the reminder.",
      },
    ],
    faqs: [
      {
        question: "Can I customize the reminder message?",
        answer: "Yes. You write the exact message Dialcues will deliver. Include appointment time, location, preparation instructions — whatever your clients need to hear.",
      },
      {
        question: "How far in advance should I set reminders?",
        answer: "Most businesses see the best results with reminders 24 hours before the appointment. You can also add a second reminder 1-2 hours before for high-priority appointments.",
      },
      {
        question: "Is this HIPAA-compliant for healthcare?",
        answer: "Dialcues does not store or transmit protected health information. Your reminder messages are in your control — keep them general (e.g. 'You have an appointment tomorrow at 2pm') to stay compliant.",
      },
    ],
    ctaHeadline: "Stop losing revenue to no-shows",
    ctaBody: "Set up automated phone call reminders for your appointments in minutes.",
  },
  {
    slug: "phone-reminder-for-seniors",
    title: "Phone Reminder for Seniors",
    metaTitle: "Phone Reminders for Seniors | Simple Voice Call Reminders",
    metaDescription:
      "AI phone call reminders designed for elderly people. No apps needed — Dialcues calls any phone to help seniors remember medications, appointments, and daily tasks.",
    heroHeadline: "Voice reminders your parents will actually hear",
    heroSubheadline:
      "Dialcues calls any phone — landlines included — with friendly AI voice reminders. No apps to install, no technology to learn. Just a helpful phone call at the right time.",
    keyword: "phone reminders for seniors",
    sections: [
      {
        heading: "Technology should be invisible",
        body: "Most reminder apps assume the user has a smartphone, understands notifications, and checks their screen regularly. For many seniors, that's not realistic. Dialcues works differently: it calls their existing phone number with a clear voice message. The person just answers the phone — something they've done their entire life.",
      },
      {
        heading: "Set it up for your parents remotely",
        body: "As a caregiver, you can create and manage all reminders from your own device. Set medication times, doctor appointment reminders, or daily check-in calls for your parent or grandparent. They never need to touch an app or a computer. You get peace of mind knowing they're being reminded on time.",
      },
      {
        heading: "Daily routines and medication adherence",
        body: "Seniors often manage multiple medications with different schedules. Missing a dose can have serious health consequences. Dialcues handles recurring reminders with configurable schedules — daily, multiple times per day, or on specific days of the week. Each call clearly states what the reminder is for.",
      },
      {
        heading: "Friendly, natural voice — not a robot",
        body: "Dialcues uses advanced AI voice technology that sounds conversational and warm. It doesn't feel like a telemarketing call or a cold automated message. The tone is designed to be helpful and clear, which matters especially for seniors who may be uncomfortable with technology.",
      },
    ],
    faqs: [
      {
        question: "Does my parent need a smartphone?",
        answer: "No. Dialcues calls any phone number — landlines, flip phones, or smartphones. No app installation needed on the receiving end.",
      },
      {
        question: "Can I manage reminders for someone else?",
        answer: "Absolutely. You create the reminders from your account and specify your parent's phone number. They just receive the calls.",
      },
      {
        question: "What if they don't answer?",
        answer: "Dialcues retries automatically. You can also check the call status from your dashboard to see if the reminder was delivered successfully.",
      },
    ],
    ctaHeadline: "Give your loved ones reliable reminders",
    ctaBody: "Set up voice call reminders for your parents or grandparents in under 2 minutes. No app needed on their end.",
  },
  {
    slug: "phone-reminder-for-students",
    title: "Phone Reminder for Students",
    metaTitle: "Phone Reminders for Students | Stay on Top of Deadlines",
    metaDescription:
      "AI-powered phone call reminders to help students never miss a class, deadline, or study session. Dialcues calls you when it matters most.",
    heroHeadline: "Stop missing deadlines and classes",
    heroSubheadline:
      "Dialcues gives you a wake-up call — literally. Get AI voice phone calls to remind you about exams, assignments, classes, and study sessions.",
    keyword: "phone reminders for students",
    sections: [
      {
        heading: "Why students need more than notifications",
        body: "Students are bombarded with digital noise: social media, messages, emails. A push notification about an assignment due tomorrow is easy to dismiss without even reading. A phone call is different — it interrupts, it demands attention, and that's exactly what you need when a deadline is approaching.",
      },
      {
        heading: "Wake-up calls that actually work",
        body: "Struggling to wake up for early morning classes? Dialcues calls your phone at the time you set. Unlike an alarm you can snooze indefinitely, a ringing phone call feels more urgent and is harder to ignore. Set a recurring daily call for those 8am lectures you keep sleeping through.",
      },
      {
        heading: "Exam and assignment reminders",
        body: "Create reminders for important due dates, exam prep sessions, or project milestones. Dialcues delivers a clear voice message reminding you exactly what's coming up, so you can plan your time accordingly. You can set reminders days in advance or hours before the deadline.",
      },
      {
        heading: "Study session accountability",
        body: "Trying to build a consistent study habit? Set a recurring Dialcues reminder for your daily study block. When a phone call tells you 'it's time to study for organic chemistry,' it's a lot harder to procrastinate than when a silent notification appears on your lock screen.",
      },
    ],
    faqs: [
      {
        question: "Is Dialcues free for students?",
        answer: "Dialcues offers a free tier that lets you set up basic reminders. Check our pricing page for the latest details on plans and features.",
      },
      {
        question: "Can I set different reminders for each class?",
        answer: "Yes. Create individual reminders for each class, assignment, or exam with custom messages, times, and recurrence patterns.",
      },
      {
        question: "Will it call me if I'm in class?",
        answer: "You control exactly when Dialcues calls. Schedule your reminders for times when you want to be reminded — before class starts, the evening before a deadline, or whenever works for you.",
      },
    ],
    ctaHeadline: "Take control of your schedule",
    ctaBody: "Sign up and set your first reminder in under a minute. Your future self will thank you.",
  },
  {
    slug: "wake-up-call-reminder",
    title: "Wake-Up Call Reminder",
    metaTitle: "Wake-Up Call Reminder Service | AI Phone Alarm",
    metaDescription:
      "Get a real phone call to wake you up. Dialcues is an AI-powered wake-up call service that rings your phone at the time you set. Harder to ignore than an alarm.",
    heroHeadline: "The alarm you can't ignore",
    heroSubheadline:
      "Dialcues calls your phone at the time you choose with a friendly AI voice. No more snoozing through alarms — a ringing phone call gets you out of bed.",
    keyword: "wake-up call reminder",
    sections: [
      {
        heading: "Why wake-up calls work better than alarms",
        body: "Your phone alarm goes off and your half-asleep brain hits snooze without thinking. It's muscle memory. But a phone call is psychologically different — it feels like someone is calling you, which triggers a social response. You're far more likely to actually wake up and stay awake when your phone rings with a call rather than an alarm tone.",
      },
      {
        heading: "How Dialcues wake-up calls work",
        body: "Set a one-time or recurring wake-up call in Dialcues. At the scheduled time, your phone rings with a real call. When you answer, an AI voice greets you and delivers your custom wake-up message. It can be motivational, informational, or simply tell you it's time to get up. You can set it daily for weekdays, weekends, or any custom schedule.",
      },
      {
        heading: "Perfect for heavy sleepers",
        body: "If you've tried every alarm app, sleep cycle tracker, and puzzle alarm and still can't wake up reliably, a phone call adds a new dimension. The ringing is persistent, the vibration pattern is different from alarms, and answering the call engages your brain in a way that a dismiss button doesn't.",
      },
      {
        heading: "More than just wake-up calls",
        body: "Once you're using Dialcues for morning calls, you'll find it useful for everything else: medication reminders, meeting prep alerts, end-of-day routines, and more. It's a general-purpose AI reminder system that happens to be incredibly effective as a wake-up service.",
      },
    ],
    faqs: [
      {
        question: "Can I customize the wake-up message?",
        answer: "Yes. Write any message you want — motivational quotes, your daily schedule, or just 'Time to wake up!' Dialcues will read it to you in a natural voice.",
      },
      {
        question: "What if I don't answer the first call?",
        answer: "Dialcues can retry the call automatically after a few minutes. You configure how many retry attempts you want.",
      },
      {
        question: "Does it work with Do Not Disturb mode?",
        answer: "Phone calls typically bypass Do Not Disturb on most devices, especially if you add the Dialcues number to your contacts or favorites. Check your phone's DND settings for details.",
      },
    ],
    ctaHeadline: "Never oversleep again",
    ctaBody: "Set up a daily wake-up call with Dialcues and start your mornings on time.",
  },
];
