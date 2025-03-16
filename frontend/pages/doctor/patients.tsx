import { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/patients/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPatients(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>My Patients</h1>
      {patients.length === 0 ? (
        <p>No patients assigned yet.</p>
      ) : (
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              {patient.name} - <a href={`/doctor/patients/${patient.id}`}>View</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
