export const getLocalStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    return stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};