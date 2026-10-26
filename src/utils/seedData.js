import { v4 as uuidv4 } from './uuid.js';
import { subDays, subHours, addDays, addHours } from 'date-fns';

const now = new Date();

const colleges = ['MIT College', 'IIT Bombay', 'BITS Pilani', 'VIT University', 'NIT Trichy', 'NMIMS', 'Pune University', 'Jadavpur University', 'SRM University', 'Amity University'];
const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'Physics', 'Mathematics', 'Chemical', 'Biotechnology', 'IT'];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Faculty'];
const names = ['Aarav Sharma', 'Priya Patel', 'Rohan Mehta', 'Ananya Singh', 'Vikram Kumar', 'Sneha Reddy', 'Karthik Nair', 'Meera Joshi', 'Arjun Gupta', 'Divya Agarwal', 'Rahul Verma', 'Pooja Iyer', 'Siddharth Rao', 'Kavita Menon', 'Nikhil Bajaj', 'Ritu Saxena', 'Aditya Pandey', 'Shweta Mishra', 'Manish Bose', 'Anjali Choudhary', 'Varun Kapoor', 'Deepika Nair', 'Akash Shah', 'Sunita Tiwari', 'Harish Pillai', 'Pallavi Desai', 'Gaurav Malhotra', 'Revathi Krishnan', 'Raj Yadav', 'Nandini Sinha', 'Sumit Jha', 'Lata Patil', 'Tushar Wagh', 'Preeti Das', 'Ajay Bhat', 'Shilpa Kulkarni', 'Vikas Tripathi', 'Maya Chatterjee', 'Nitin Ahuja', 'Kriti Goel', 'Saurabh Tomar', 'Swati Banerjee', 'Dhruv Sethi', 'Tanvi Rawat', 'Aman Mathur', 'Neha Dube', 'Rakesh Khanna', 'Preethi Mohan', 'Amit Rajan', 'Zara Khan'];

const eventData = [
  {
    title: 'TechSummit 2025',
    description: 'A premier technology conference featuring keynotes from industry leaders in AI, blockchain, and cloud computing. Network with 500+ professionals.',
    category: 'Technology',
    date: addDays(now, 15).toISOString(),
    time: '09:00',
    venue: 'Mumbai Convention Centre, Bandra Kurla Complex, Mumbai',
    capacity: 500,
    deadline: addDays(now, 10).toISOString().slice(0, 10),
    status: 'open',
    bannerColor: 'from-blue-600 to-cyan-500',
    emoji: '💻',
  },
  {
    title: 'Cultural Fest — Zeitgeist',
    description: 'The annual inter-college cultural extravaganza featuring music, dance, drama, and art competitions. Over 30 colleges compete for glory.',
    category: 'Cultural',
    date: addDays(now, 28).toISOString(),
    time: '10:00',
    venue: 'IIT Bombay Campus, Powai, Mumbai',
    capacity: 2000,
    deadline: addDays(now, 20).toISOString().slice(0, 10),
    status: 'open',
    bannerColor: 'from-purple-600 to-pink-500',
    emoji: '🎭',
  },
  {
    title: 'Hackathon — Code for Good',
    description: '36-hour intensive hackathon solving real social problems. Mentors from top tech companies, ₹5L prize pool. Solo or team of 2-4.',
    category: 'Hackathon',
    date: addDays(now, 7).toISOString(),
    time: '08:00',
    venue: 'Online (Discord + HackerEarth)',
    capacity: 300,
    deadline: addDays(now, 4).toISOString().slice(0, 10),
    status: 'open',
    bannerColor: 'from-emerald-600 to-teal-500',
    emoji: '🏆',
  },
  {
    title: 'AI Workshop Series',
    description: 'Hands-on 3-day deep learning workshop covering computer vision, NLP, and generative AI. Bring your laptop — we supply the GPUs.',
    category: 'Workshop',
    date: subDays(now, 5).toISOString(),
    time: '11:00',
    venue: 'NMIMS Auditorium, Vile Parle, Mumbai',
    capacity: 150,
    deadline: subDays(now, 10).toISOString().slice(0, 10),
    status: 'closed',
    bannerColor: 'from-amber-500 to-orange-500',
    emoji: '🤖',
  },
  {
    title: 'Startup Pitch Day',
    description: 'Present your startup idea to a panel of VCs and angel investors. Top 3 pitches get seed funding up to ₹50L. Open to all college students.',
    category: 'Business',
    date: addDays(now, 45).toISOString(),
    time: '14:00',
    venue: 'Nasscom HQ, Koramangala, Bangalore',
    capacity: 100,
    deadline: addDays(now, 35).toISOString().slice(0, 10),
    status: 'draft',
    bannerColor: 'from-rose-500 to-pink-600',
    emoji: '🚀',
  },
];

export function seedData() {
  const events = eventData.map((e, i) => ({
    id: uuidv4(),
    ...e,
    registrations: 0,
    customFields: i === 0
      ? [
          { id: uuidv4(), type: 'text', label: 'LinkedIn Profile', required: false, placeholder: 'https://linkedin.com/in/...' },
          { id: uuidv4(), type: 'dropdown', label: 'Session Preference', required: true, options: ['AI & ML', 'Web3 & Blockchain', 'Cloud Architecture', 'DevOps'] },
        ]
      : i === 2
      ? [
          { id: uuidv4(), type: 'text', label: 'Team Name', required: true, placeholder: 'e.g. The Debuggers' },
          { id: uuidv4(), type: 'number', label: 'Team Size', required: true, placeholder: '1-4' },
          { id: uuidv4(), type: 'dropdown', label: 'Problem Domain', required: true, options: ['Healthcare', 'Education', 'Environment', 'Finance', 'Other'] },
        ]
      : [],
    createdAt: subDays(now, 30 - i * 5).toISOString(),
    updatedAt: subDays(now, 10 - i).toISOString(),
  }));

  const participants = [];
  // Assign participants across events — more to open events
  const dist = [20, 15, 8, 5, 2]; // participants per event
  events.forEach((evt, ei) => {
    const count = dist[ei] ?? 0;
    for (let i = 0; i < count; i++) {
      const name = names[(ei * 10 + i) % names.length];
      const email = name.toLowerCase().replace(/\s+/g, '.') + `${ei}${i}@example.com`;
      participants.push({
        id: uuidv4(),
        eventId: evt.id,
        registrationId: `EF-${(Date.now() + ei * 100 + i).toString(36).toUpperCase()}`,
        name,
        email,
        phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
        college: colleges[i % colleges.length],
        department: departments[i % departments.length],
        year: years[i % years.length],
        attended: ei === 3 && i < 4, // mark some from the past event as attended
        registeredAt: subHours(now, (dist[ei] - i) * 6 + ei * 24).toISOString(),
        customFieldValues: {},
      });
    }
  });

  // Update event registration counts
  events.forEach((evt) => {
    evt.registrations = participants.filter((p) => p.eventId === evt.id).length;
  });

  // Feedback for the closed workshop (event index 3)
  const workshopId = events[3].id;
  const workshopParticipants = participants.filter((p) => p.eventId === workshopId);
  const ratings = [5, 4, 5, 4, 3];
  const liked = [
    'The hands-on exercises were amazing. The GPU access was super useful.',
    'Loved the NLP section, especially the transformer architecture deep-dive.',
    'Great mentors and very well-organized content. Learned a lot!',
    'Real-world project examples made the concepts very clear.',
    'Good content, but the pace was a bit fast for beginners.',
  ];
  const suggestions = [
    'Would love more time on GANs and diffusion models.',
    'Add more exercises and fewer slides.',
    'Maybe include a certificate for completion.',
    'More networking time between sessions would be great.',
    'Slow down a bit, pack a lot in 3 days.',
  ];

  const feedback = workshopParticipants.slice(0, 5).map((p, i) => ({
    id: uuidv4(),
    eventId: workshopId,
    participantId: p.id,
    participantName: ratings[i] >= 4 || i % 2 === 0 ? p.name : 'Anonymous',
    isAnonymous: i % 3 === 2,
    rating: ratings[i],
    liked: liked[i],
    suggestions: suggestions[i],
    submittedAt: subHours(now, (5 - i) * 12).toISOString(),
  }));

  // Also add some feedback for the Cultural Fest
  const cultFestId = events[1].id;
  const cultParticipants = participants.filter((p) => p.eventId === cultFestId);
  const cultRatings = [4, 5, 4];
  const cultLiked = ['Amazing performances!', 'The dance competition was electrifying.', 'Great coordination and energy.'];
  const cultSugg = ['Need more food stalls.', 'Bigger venue next year!', 'More inter-college competitions.'];
  cultParticipants.slice(0, 3).forEach((p, i) => {
    feedback.push({
      id: uuidv4(),
      eventId: cultFestId,
      participantId: p.id,
      participantName: p.name,
      isAnonymous: false,
      rating: cultRatings[i],
      liked: cultLiked[i],
      suggestions: cultSugg[i],
      submittedAt: subHours(now, (3 - i) * 8).toISOString(),
    });
  });

  return { events, participants, feedback };
}
