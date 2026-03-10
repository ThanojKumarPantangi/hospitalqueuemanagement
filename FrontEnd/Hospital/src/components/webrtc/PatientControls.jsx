export default function PatientControls({ onEndCall }) {

  return (
    <div style={{ marginTop: "20px" }}>
      <button onClick={onEndCall}>
        Leave Call
      </button>
    </div>
  );

}