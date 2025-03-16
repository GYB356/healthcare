import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function PatientDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) {
      const token = localStorage.getItem("token");

      axios
        .get(`/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setPatient(res.data))
        .catch(() => router.push("/doctor/patients"));
    }
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");

    await axios.put(`/api/patients/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setEditMode(false);
    setPatient({ ...patient, ...formData });
  };

  if (!patient) return <p>Loading...</p>;

  return (
    <div>
      <h1>{patient.name}</h1>
      <p>Email: {patient.email}</p>
      <p>Condition: {editMode ? <input defaultValue={patient.condition} onChange={(e) => setFormData({ condition: e.target.value })} /> : patient.condition}</p>
      {editMode ? <button onClick={handleUpdate}>Save</button> : <button onClick={() => setEditMode(true)}>Edit</button>}
    </div>
  );
}
