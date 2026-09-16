const committeeSections = [
  {
    title: "अध्यक्ष",
    members: [
      { name: "श्री आलोक तिवारी", designation: "प्रबंध निदेशक",phone: "01126105291",
        email: "mdnicsi@nic.in" },
    ],
  },
  {
    title: "उपाध्यक्ष",
    members: [
     { name: "श्री प्रसन्न पांडे", designation: "महाप्रबंधक",phone: "01122900524", email: "prasanna.pandey@nic.in", },
    ],
  },
  {
    title: "सदस्य सचिव",
    members: [
      {
        name: "श्री विकास दीक्षित",
        designation: "प्रबंधक",
        phone: "01122900503",
        email: "vikas.dixit@nic.in",
      },
    ],
  },
  {
    title: "सदस्य",
    members: [
 
      { name: "श्री शैलेंद्र सक्सेना", designation: "उप-महाप्रबंधक",phone: "01122900562", email: "shailendra.saxena@nic.in" },
      { name: "श्री महेश कुमार", designation: "उप-प्रबंधक" ,phone: "01122900518", email: "maheshk@nic.in"},
    ],
  },
];

export default function RajbhashaSamiti() {
  return (
    <div className="page committee-page">
      <h1>राजभाषा कार्यान्वयन समिति:-</h1>
      {committeeSections.map((section) => (
        <section className="committee-section" key={section.title}>
          <h2>{section.title} :</h2>
          <div className="table-wrap">
            <table className="committee-table">
              <thead>
                <tr>
                  <th>नाम</th>
                  <th>पदनाम</th>
                  <th>टेलीफ़ोन</th>
                  <th>ई-मेल</th>
                </tr>
              </thead>
              <tbody>
                {section.members.map((member) => (
                  <tr key={member.name}>
                    <td>{member.name}</td>
                    <td>{member.designation}</td>
                    <td>{member.phone || ""}</td>
                    <td>{member.email || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
