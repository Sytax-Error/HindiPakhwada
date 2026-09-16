const guests = [
  ["17.09.2026", "डॉ. अरविन्द पथिक", "NCTE, PGT लेक्चरर", "9910416496", "arvind61972@gmail.com"],
  ["18.09.2026", "डॉ. सुमन", "DIRD, प्रिंसिपल", "9896917766", "Sumanlata3592@gmaol.com"],
  ["21.09.2026", "श्री पवन मालवीय", "DGCA, डायरेक्टर", "9958312027", "Pavanmalviya.dgca@gov.in"],
  ["23.09.2026", "श्री विनय सिंह", "राजभाषा, पार्लियामेंट", "9820040660", "vs67126@gmail.com"],
  ["25.09.2026", "डॉ. दीपा", "दिल्ली यूनिवर्सिटी", "9654336989", "principal@aurobindo.du.ac.in"],
  ["28.09.2026", "श्री शरद द्विवेदी", "स्टूडेंट-पार्लियामेंट", "7011805301", "sharad.dwivedi@nic.in"],
];

export default function Guests() {
  return (
    <div className="page guests-page">
      <header className="directions-title">
        <p>हिन्दी पखवाड़ा 2026</p>
        <h1>अतिथि परिचय</h1>
      </header>
      <div className="table-wrap">
        <table className="guests-table">
          <thead><tr><th>दिनांक</th><th>अतिथि का नाम</th><th>कार्यालय का नाम</th><th>मोबाइल नं.</th><th>ई-मेल आईडी</th></tr></thead>
          <tbody>
            {guests.map((guest) => <tr key={guest[0]}>{guest.map((value) => <td key={value}>{value}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}