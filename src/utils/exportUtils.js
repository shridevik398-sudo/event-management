import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/** Export data to Excel (.xlsx) */
export function exportToExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/** Export data to CSV */
export function exportToCSV(data, filename = 'export.csv') {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export raw JSON */
export function exportToJSON(data, filename = 'backup.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse an uploaded Excel/CSV file, returning an array of row objects */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve({ data: results.data, columns: results.meta.fields }),
        error: reject,
      });
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        resolve({ data, columns });
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type. Please upload .xlsx, .xls, or .csv'));
    }
  });
}

/** Generate a sample participant template Excel file */
export function downloadParticipantTemplate() {
  const template = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
      college: 'MIT College',
      department: 'Computer Science',
      year: '2nd Year',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '9123456789',
      college: 'IIT Bombay',
      department: 'Electronics',
      year: '3rd Year',
    },
  ];
  exportToExcel(template, 'participant_template.xlsx', 'Participants');
}

/** Generate a sample events template Excel file */
export function downloadEventsTemplate() {
  const template = [
    {
      title: 'Sample Event',
      description: 'Event description',
      category: 'Technology',
      date: new Date().toISOString().slice(0, 10),
      time: '10:00',
      venue: 'Venue or Online Link',
      capacity: 100,
      deadline: new Date().toISOString().slice(0, 10),
      status: 'draft',
    },
  ];
  exportToExcel(template, 'events_template.xlsx', 'Events');
}

/** Format participant data for export */
export function formatParticipantsForExport(participants, events) {
  return participants.map((p) => {
    const event = events.find((e) => e.id === p.eventId);
    return {
      'Registration ID': p.registrationId,
      'Name': p.name,
      'Email': p.email,
      'Phone': p.phone,
      'College/Organization': p.college,
      'Department': p.department,
      'Year/Designation': p.year,
      'Event': event?.title ?? p.eventId,
      'Attended': p.attended ? 'Yes' : 'No',
      'Registered At': p.registeredAt ? new Date(p.registeredAt).toLocaleString() : '',
    };
  });
}

/** Format feedback data for export */
export function formatFeedbackForExport(feedback, events) {
  return feedback.map((f) => {
    const event = events.find((e) => e.id === f.eventId);
    return {
      'Event': event?.title ?? f.eventId,
      'Name': f.isAnonymous ? 'Anonymous' : f.participantName,
      'Rating': f.rating,
      'What They Liked': f.liked,
      'Suggestions': f.suggestions,
      'Submitted At': f.submittedAt ? new Date(f.submittedAt).toLocaleString() : '',
    };
  });
}
