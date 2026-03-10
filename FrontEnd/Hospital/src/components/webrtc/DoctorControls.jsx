export default function DoctorControls({ onEndCall }) {

  return (
    <div style={{ marginTop: "20px" }}>
      <button onClick={onEndCall}>
        End Call
      </button>
    </div>
  );

}