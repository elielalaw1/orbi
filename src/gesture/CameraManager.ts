export class CameraManager {
  stream: MediaStream | null = null;
  onDisconnect?: () => void;
  async start(video: HTMLVideoElement) {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error(
        "Camera requires localhost or HTTPS and a supported browser.",
      );
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    for (const track of this.stream.getVideoTracks())
      track.onended = () => this.onDisconnect?.();
    video.srcObject = this.stream;
    await video.play();
  }
  stop(video: HTMLVideoElement) {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    video.srcObject = null;
  }
}
