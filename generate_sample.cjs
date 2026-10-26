const fs = require('fs');
const path = require('path');

const rows = ['name,email,phone,college,department,year'];
const depts = ['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Biotechnology'];
const colleges = ['MIT Tech', 'Stanford University', 'Harvard University', 'UC Berkeley', 'IIT Bombay'];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

for (let i = 1; i <= 5000; i++) {
  const name = `Participant ${i}`;
  const email = `participant${i}@campus.edu`;
  const phone = `+1-555-${String(1000 + (i % 9000)).padStart(4, '0')}`;
  const college = colleges[i % colleges.length];
  const department = depts[i % depts.length];
  const year = years[i % years.length];
  rows.push(`"${name}","${email}","${phone}","${college}","${department}","${year}"`);
}

const csvContent = rows.join('\r\n');
fs.writeFileSync(path.join(__dirname, 'test_5000_participants.csv'), csvContent);
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'test_5000_participants.csv'), csvContent);
console.log(`Successfully generated 5,000 participant records in test_5000_participants.csv (${(csvContent.length / 1024).toFixed(1)} KB)`);
